import { performance } from 'perf_hooks';

class ChatReferenceBinaryData {
    constructor(public mimeType: string, public reference?: any) {}
    async data() {
        return new Promise<Uint8Array>(resolve => setTimeout(() => resolve(new Uint8Array(10)), 100)); // Simulate 100ms delay for fetching image
    }
}

const toAnthropicImageMediaType = (mimeType: string) => mimeType;
const URI = { isUri: (v: any) => false };
const isLocation = (v: any) => false;
const uriToString = (v: any) => '';

const request = {
    prompt: "Hello",
    references: [
        { value: new ChatReferenceBinaryData('image/png') },
        { value: new ChatReferenceBinaryData('image/jpeg') },
        { value: new ChatReferenceBinaryData('image/webp') },
        { value: new ChatReferenceBinaryData('image/gif') },
        { value: new ChatReferenceBinaryData('image/png') },
    ]
};

async function original() {
    const contentBlocks: any[] = [];
    const extraRefsTexts: string[] = [];
    let prompt = request.prompt;
    for (const ref of request.references) {
        let refValue = ref.value;
        if (refValue instanceof ChatReferenceBinaryData) {
            const mediaType = toAnthropicImageMediaType(refValue.mimeType);
            if (mediaType) {
                const data = await refValue.data();
                contentBlocks.push({
                    type: 'image',
                    source: {
                        type: 'base64',
                        data: Buffer.from(data).toString('base64'),
                        media_type: mediaType
                    }
                });
                continue;
            }
            if (!refValue.reference) continue;
            refValue = refValue.reference;
        }
    }
}

async function optimized() {
    const contentBlocks: any[] = [];
    const extraRefsTexts: string[] = [];
    let prompt = request.prompt;

    const resolvedReferences = await Promise.all(request.references.map(async (ref) => {
        let refValue = ref.value;
        if (refValue instanceof ChatReferenceBinaryData) {
            const mediaType = toAnthropicImageMediaType(refValue.mimeType);
            if (mediaType) {
                const data = await refValue.data();
                return { ref, mediaType, data };
            }
        }
        return { ref };
    }));

    for (const resolvedRef of resolvedReferences) {
        const { ref, mediaType, data } = resolvedRef;
        let refValue = ref.value;
        if (refValue instanceof ChatReferenceBinaryData) {
            if (mediaType && data) {
                contentBlocks.push({
                    type: 'image',
                    source: {
                        type: 'base64',
                        data: Buffer.from(data).toString('base64'),
                        media_type: mediaType
                    }
                });
                continue;
            }
            if (!refValue.reference) continue;
            refValue = refValue.reference;
        }
    }
}

async function run() {
    let start = performance.now();
    await original();
    console.log(`Original: ${performance.now() - start}ms`);

    start = performance.now();
    await optimized();
    console.log(`Optimized: ${performance.now() - start}ms`);
}

run();

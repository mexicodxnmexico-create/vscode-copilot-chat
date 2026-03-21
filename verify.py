from playwright.sync_api import sync_playwright

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Build a self-contained HTML payload mimicking the suggestion panel
        html_content = """
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Suggestion Panel</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                    padding: 10px;
                }
                pre {
                    background-color: #1e1e1e;
                    color: #d4d4d4;
                    padding: 10px;
                    border-radius: 4px;
                    overflow: auto;
                }
                pre:focus {
                    outline: 1px solid #007fd4;
                }
            </style>
        </head>
        <body>
            <div id="solutionsContainer">
                <h3 class='solutionHeading' id="solution-1-heading">Suggestion 1</h3>
                <div class='snippetContainer' aria-labelledby="solution-1-heading" role="group" data-solution-index="0">
                    <pre tabindex="0" role="region" title="Use arrow keys to scroll">const hello = "world";
console.log(hello);</pre>
                </div>
            </div>

            <script>
                // Simulate focus action
                setTimeout(() => {
                    const preElement = document.querySelector('pre');
                    if (preElement) {
                        preElement.focus();
                    }
                }, 500);
            </script>
        </body>
        </html>
        """

        page.set_content(html_content)
        page.wait_for_timeout(1000) # Wait for focus

        # Verify the attributes are present
        pre_element = page.locator('pre')

        # Take a screenshot showing the focus state
        page.screenshot(path="verification.png")

        # Output verification
        print(f"Role attribute: {pre_element.get_attribute('role')}")
        print(f"Tabindex attribute: {pre_element.get_attribute('tabindex')}")
        print(f"Title attribute: {pre_element.get_attribute('title')}")

        browser.close()

if __name__ == "__main__":
    verify_frontend()

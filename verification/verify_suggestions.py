from playwright.sync_api import sync_playwright, expect
import os

def test_suggestions_panel(page):
    # Load the local HTML file
    file_path = os.path.abspath("verification/index.html")
    page.goto(f"file://{file_path}")

    # Verify aria-busy attribute on solutionsContainer
    solutions_container = page.locator("#solutionsContainer")
    expect(solutions_container).to_have_attribute("aria-busy", "false")
    print("✅ Verified aria-busy is false")

    # Verify the citation link has the correct aria-label
    link = page.get_by_role("link", name="Inspect source code")
    expect(link).to_have_attribute("aria-label", "Inspect source code (opens in a new window)")
    print("✅ Verified aria-label on link")

    # Take screenshot
    page.screenshot(path="verification/verification.png")
    print("✅ Screenshot captured")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_suggestions_panel(page)
        except Exception as e:
            print(f"❌ Test failed: {e}")
            exit(1)
        finally:
            browser.close()

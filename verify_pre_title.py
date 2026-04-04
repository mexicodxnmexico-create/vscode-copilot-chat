from playwright.sync_api import sync_playwright, expect

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.set_content("""
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            pre {
              border: 1px solid #ccc;
              padding: 10px;
              width: 300px;
              overflow: auto;
            }
            pre:focus {
              outline: 2px solid blue;
            }
          </style>
        </head>
        <body style="background-color: #1e1e1e; color: white; padding: 20px;">
          <div id="solutionsContainer">
            <h3 class='solutionHeading' id="solution-1-heading">Suggestion 1</h3>
            <div class='snippetContainer' aria-labelledby="solution-1-heading" role="group" data-solution-index="0">
              <pre tabindex="0" title="Use arrow keys to scroll">
function example() {
  console.log('This is a test snippet.');
  // More code here...
}
              </pre>
            </div>
          </div>
        </body>
        </html>
        """)

        pre_element = page.locator('pre')

        # Verify the attributes are correct
        expect(pre_element).to_have_attribute('tabindex', '0')
        expect(pre_element).to_have_attribute('title', 'Use arrow keys to scroll')

        # Focus the element to show the focus ring
        pre_element.focus()

        # Hover the element to trigger the tooltip
        pre_element.hover()

        # Wait a moment for visual updates
        page.wait_for_timeout(500)

        page.screenshot(path="verification_pre_title.png")
        browser.close()

if __name__ == "__main__":
    verify()

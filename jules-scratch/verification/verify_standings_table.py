import re
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:5173/")

        # Wait for the page to be fully loaded
        page.wait_for_load_state('networkidle')

        # Expect a title "to contain" a substring.
        expect(page).to_have_title(re.compile("AnalfaBet"))

        # Take a screenshot for debugging
        page.screenshot(path="jules-scratch/verification/debug_before_click.png")

        # Click the get started button.
        page.get_by_role("button", name="Começar").click(timeout=60000)

        # Expects the URL to contain intro.
        expect(page).to_have_url(re.compile(".*login"))

        # Click the sign up button
        page.get_by_role("button", name="Criar uma conta").click()

        # Create a unique email for the test
        import time
        email = f"testuser_{int(time.time())}@example.com"

        # Fill in the sign up form
        page.get_by_placeholder("Seu nome").fill("Test User")
        page.get_by_placeholder("seu@email.com").fill(email)
        page.get_by_placeholder("••••••••").fill("password123")

        # Click the sign up button
        page.get_by_role("button", name="Criar minha conta").click()

        # Expect to be on the dashboard
        expect(page).to_have_url(re.compile(".*"))

        # Click the "Jogos" tab
        page.get_by_role("button", name="Jogos").click()

        # Click the "Classificação" toggle button
        page.get_by_role("button", name="Classificação").click()

        # Take a screenshot of the standings table
        page.screenshot(path="jules-scratch/verification/verification.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)

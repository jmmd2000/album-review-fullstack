// This e2e test checks the flow of creating an album
// First it logs in via the admin dropdown
// Then it uses the search to find an abba album.
// It enters review data and submits it
// Then it checks that the album appears on the grid on /albums and that the review details page loads
// It then does the same for the artist.

describe("Create Album Review Flow", () => {
  const searchTerm = "abba";
  const reviewText = "great album, I enjoyed it";

  it("complete album review creation flow", () => {
    // Step 1: Login as admin
    cy.visit("/");
    cy.get('[data-testid="admin-dropdown-desktop"] [data-testid="admin-dropdown-button"]', {
      timeout: 10000,
    }).should("be.visible");

    cy.get(
      '[data-testid="admin-dropdown-desktop"] [data-testid="admin-dropdown-button"]'
    ).click();
    cy.wait(500);

    cy.env(["adminPassword"]).then(({ adminPassword }) => {
      cy.get('[data-testid="admin-password-input"]').type(adminPassword);
    });

    cy.contains("button", "Login").click();
    cy.wait(1500);

    // Step 2: Navigate to Search page
    cy.contains("a", "Search").first().click();
    cy.url().should("include", "/search");
    cy.wait(1000);

    // Step 3: Search for album
    cy.get('[data-testid="search-input"]').type(searchTerm);
    cy.wait(500);
    cy.contains("button", "Search").click();
    cy.wait(2000);

    cy.get('[data-testid="album-card"]', { timeout: 10000 }).should(
      "have.length.greaterThan",
      0
    );

    // Step 4: Click first album to navigate to review form
    cy.get('[data-testid="album-card"]').first().click();

    cy.url({ timeout: 10000 }).should("include", "/albums/");
    cy.url().should("include", "/create");

    cy.get('[data-testid="album-review-form"]', { timeout: 10000 }).should("exist");

    // Step 5: Fill out the review form
    cy.get('input[placeholder="Best song..."]').type("Dancing Queen");
    cy.wait(300);

    cy.get('input[placeholder="Worst song..."]').type("Happy Hawaii");
    cy.wait(300);

    cy.get('[data-testid="review-content-textarea"]').type(reviewText);
    cy.wait(300);

    cy.contains("button", /add genre/i).click();
    cy.wait(500);
    cy.get('input[placeholder="Enter genre"]').type("pop");
    cy.wait(300);

    cy.contains("button", /add genre/i).click();
    cy.wait(500);
    cy.get('input[placeholder="Enter genre"]').eq(1).type("disco");
    cy.wait(300);

    cy.get('[data-testid="color-picker-button"]').first().click();
    cy.wait(300);

    cy.get('input[id="aasToggle"]').check();
    cy.wait(300);

    cy.get('[data-testid="track-rating-select"]').each($select => {
      cy.wrap($select).select(Math.floor(Math.random() * 10));
      cy.wait(50);
    });

    // Step 6: Submit the form
    cy.get('[data-testid="album-review-form"] button[type="submit"]').click();

    cy.contains("Review submitted successfully!", { timeout: 10000 });

    // Step 7: Navigate to albums page
    cy.visit("/albums");
    cy.get('[data-testid="album-grid"]', { timeout: 10000 }).should("exist");

    // Step 8: New album should be visible
    cy.get('[data-testid="search-input"]').type(searchTerm);
    cy.wait(1000);

    cy.get('[data-testid="album-card"]').should("have.length.greaterThan", 0);

    // Step 9: Click on the newly created album
    cy.get('[data-testid="album-card"]').first().click();
    cy.wait(1500);

    cy.get("body").should("not.contain", "404");

    // Step 10: Verify the review content is displayed
    cy.get("body").should("contain.text", reviewText);

    // Step 11: Click artist link
    cy.get("a[href*='/artists/']").first().click();
    cy.wait(1500);

    // Step 12: Verify artist page loaded
    cy.get("body").should("not.contain", "404");
    cy.url().should("include", "/artists/");

    // Step 13: Navigate to /artists page
    cy.visit("/artists");
    cy.get('[data-testid="album-grid"]', { timeout: 10000 }).should("exist");

    cy.get('[data-testid="search-input"]').type(searchTerm);
    cy.wait(500);
    cy.contains("button", "Search").click();
    cy.wait(2000);

    cy.get('[data-testid="artist-card"]').should("have.length.greaterThan", 0);

    cy.get('[data-testid="artist-card"]').first().click();
    cy.wait(1500);
  });
});

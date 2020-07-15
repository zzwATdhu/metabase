import {
  restore,
  signInAsAdmin,
  setupEmail,
  signInAsNormalUser,
} from "__support__/cypress";
// Ported from initial_collection.e2e.spec.js

// Z because the api lists them alphabetically by name, so it makes it easier to check
const collection_name = "Z Collection";
const sub_collection_name = "ZZ Sub-Collection";
const pulse_name = "Test pulse";
const dashboard_name = "Test Dashboard";

function createPulse() {
  cy.visit("/pulse/create");
  cy.findByPlaceholderText("Important metrics").type(pulse_name);
  cy.findByText("Select a question").click();
  cy.findByText("Orders").click();
  cy.findByPlaceholderText(
    "Enter email addresses you'd like this data to go to",
  )
    .click()
    .clear();
  cy.contains("Bobby").click();
  cy.findByText("To:").click();

  cy.findByText("Robert Tableton").should("not.exist");
  cy.findByText("Bobby Tables");
  cy.findByText("Create pulse").click();
}

describe("scenarios > collection_defaults", () => {
  before(() => {
    restore();
    cy.server();
  });

  describe("for admins", () => {
    beforeEach(signInAsAdmin);

    describe("a new collection", () => {
      it("should be the parent collection", () => {
        // Make new collection
        cy.request("POST", "api/collection/", {
          name: collection_name,
          color: "#ff9a9a",
          personal_owner_id: 1,
        });

        // Check that it has no parent
        let length = 7;
        cy.request("api/collection").then(response => {
          expect(response.body).to.have.length(length);
          expect(response.body[length - 1].name).to.equal(collection_name);
          expect(response.body[length - 1].location).to.equal("/");
        });
      });

      it("should be a sub collection", () => {
        // Make new sub collection
        cy.request("POST", "api/collection/", {
          name: sub_collection_name,
          color: "#ff9a9a",
          personal_owner_id: 1,
          parent_id: 1,
        });

        // Check that it has a parent
        let length = 8;
        cy.request("api/collection").then(response => {
          expect(response.body).to.have.length(length);
          expect(response.body[length - 1].name).to.equal(sub_collection_name);
          expect(response.body[length - 1].location).to.equal("/1/");
        });
      });
    });

    describe("a new pulse", () => {
      it("should be in the root collection", () => {
        // Configure email
        cy.visit("/admin/settings/email");
        setupEmail();

        // Make new pulse
        createPulse();

        // Check for pulse in root collection
        cy.visit("/collection/root");
        cy.findByText("My personal collection").then(() => {
          cy.get(".Icon-pulse");
        });

        // cy.request("/api/pulse").then((response) => {
        //     // *** Should the value here really be nll or should it be "root"?
        //     expect(response.body[0].collection_id).to.have.value(null);
        // });
      });
    });

    describe("a new dashboard", () => {
      it("should be the root collection", () => {
        // Make new dashboard and check collection name
        cy.request("POST", "/api/dashboard", { name: dashboard_name });

        cy.visit("/collection/root");
        cy.findByText(dashboard_name);
      });
    });
  });

  describe("for users", () => {
    before(restore);
    beforeEach(signInAsNormalUser);

    describe("a new pulse", () => {
      before(() => {
        signInAsAdmin();
        cy.visit("/admin/settings/email");
        setupEmail();
      });

      it("should be in the root collection", () => {
        // Make new pulse
        createPulse();

        // Check for pulse in root collection
        cy.visit("/collection/root");
        cy.findByText("My personal collection").then(() => {
          cy.get(".Icon-pulse");
        });
      });
    });

    describe("a new dashboard", () => {
      it("should be in the root collection", () => {
        // Make new dashboard and check collection name
        cy.request("POST", "/api/dashboard", { name: dashboard_name });

        cy.visit("/collection/root");
        cy.findByText(dashboard_name);
      });
    });
  });
});

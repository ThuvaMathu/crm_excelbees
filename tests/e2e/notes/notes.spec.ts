import { test, expect } from "../../fixtures/auth";
import { NotesPage } from "../../pages/notes.page";

function orgIdOf(page: import("@playwright/test").Page): string {
  const match = page.url().match(/\/org\/([^/]+)/);
  if (!match) throw new Error("No orgId in URL");
  return match[1];
}

// Each note renders as <Card className="relative group ..."> with the "..."
// menu button in CardHeader and the note text in a sibling CardContent —
// they're siblings, not ancestor/descendant. Scoping to any div containing
// the note text (e.g. `locator("div").filter({hasText}).last()`) picks the
// innermost matching div, which is the text-only CardContent — it never
// contains the menu button, so `.getByRole("button")` inside it always times
// out. Scope to the outer Card (identified by its "group" class) instead,
// which contains both.
function noteCard(page: import("@playwright/test").Page, content: string) {
  return page.locator("div.group").filter({ hasText: content }).last();
}

// Covers humanlike-test-case.md section 15 (Notes).
test.describe("Notes", () => {
  test("15.1 create a note", async ({ adminPage }) => {
    const notes = new NotesPage(adminPage);
    await notes.goto(orgIdOf(adminPage));
    await notes.createButton.click();
    const dialog = adminPage.getByRole("dialog");
    const content = `E2E note ${Date.now()}`;
    await dialog.getByPlaceholder(/write your note here/i).fill(content);
    await dialog.getByRole("button", { name: /^create$/i }).click();
    await expect(adminPage.getByText(content)).toBeVisible({ timeout: 10000 });
  });

  test("15.2 create note with empty content disables Create button", async ({ adminPage }) => {
    const notes = new NotesPage(adminPage);
    await notes.goto(orgIdOf(adminPage));
    await notes.createButton.click();
    const dialog = adminPage.getByRole("dialog");
    await expect(dialog.getByRole("button", { name: /^create$/i })).toBeDisabled();
  });

  test("15.3/15.4 pin then unpin a note", async ({ adminPage }) => {
    const notes = new NotesPage(adminPage);
    await notes.goto(orgIdOf(adminPage));
    await notes.createButton.click();
    const dialog = adminPage.getByRole("dialog");
    const content = `E2E pin note ${Date.now()}`;
    await dialog.getByPlaceholder(/write your note here/i).fill(content);
    await dialog.getByRole("button", { name: /^create$/i }).click();
    await expect(adminPage.getByText(content)).toBeVisible({ timeout: 10000 });

    await noteCard(adminPage, content).getByRole("button").last().click();
    await adminPage.getByRole("menuitem", { name: /^pin$/i }).click();
    await expect(notes.pinnedSection).toBeVisible({ timeout: 10000 });

    await noteCard(adminPage, content).getByRole("button").last().click();
    await adminPage.getByRole("menuitem", { name: /^unpin$/i }).click();
  });

  test("15.5 edit a note", async ({ adminPage }) => {
    const notes = new NotesPage(adminPage);
    await notes.goto(orgIdOf(adminPage));
    await notes.createButton.click();
    const dialog = adminPage.getByRole("dialog");
    const content = `E2E edit note ${Date.now()}`;
    await dialog.getByPlaceholder(/write your note here/i).fill(content);
    await dialog.getByRole("button", { name: /^create$/i }).click();
    await expect(adminPage.getByText(content)).toBeVisible({ timeout: 10000 });

    await noteCard(adminPage, content).getByRole("button").last().click();
    await adminPage.getByRole("menuitem", { name: /^edit$/i }).click();
    const editDialog = adminPage.getByRole("dialog");
    await editDialog.getByPlaceholder(/write your note here/i).fill(content + " updated");
    await editDialog.getByRole("button", { name: /^update$/i }).click();
    await expect(adminPage.getByText(content + " updated")).toBeVisible({ timeout: 10000 });
  });

  test("15.6 delete a note", async ({ adminPage }) => {
    const notes = new NotesPage(adminPage);
    await notes.goto(orgIdOf(adminPage));
    await notes.createButton.click();
    const dialog = adminPage.getByRole("dialog");
    const content = `E2E delete note ${Date.now()}`;
    await dialog.getByPlaceholder(/write your note here/i).fill(content);
    await dialog.getByRole("button", { name: /^create$/i }).click();
    await expect(adminPage.getByText(content)).toBeVisible({ timeout: 10000 });

    // Note deletion has no confirmation dialog — the dropdown item deletes
    // immediately (onClick={() => onDelete(note.id)} directly, no
    // AlertDialog in between), unlike leads/contacts/companies.
    await noteCard(adminPage, content).getByRole("button").last().click();
    await adminPage.getByRole("menuitem", { name: /^delete$/i }).click();
    await expect(adminPage.getByText(content)).not.toBeVisible({ timeout: 10000 });
  });

  test("15.7 search notes filters by content", async ({ adminPage }) => {
    const notes = new NotesPage(adminPage);
    await notes.goto(orgIdOf(adminPage));
    await notes.createButton.click();
    const dialog = adminPage.getByRole("dialog");
    const content = `E2E searchable note ${Date.now()}`;
    await dialog.getByPlaceholder(/write your note here/i).fill(content);
    await dialog.getByRole("button", { name: /^create$/i }).click();
    await expect(adminPage.getByText(content)).toBeVisible({ timeout: 10000 });

    await notes.searchInput.fill("searchable note");
    await adminPage.getByRole("button", { name: "Search", exact: true }).click();
    await expect(adminPage.getByText(content)).toBeVisible({ timeout: 10000 });
  });
});

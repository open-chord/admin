import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { MenuBar, Sidebar } from "./AppChrome";

describe("MenuBar", () => {
  it("exposes import and add actions from File", async () => {
    const user = userEvent.setup();
    const onImportAlbum = vi.fn();
    const onAddTrack = vi.fn();
    const onArchive = vi.fn();
    const setOpenMenu = vi.fn();

    const { rerender } = render(
      <MenuBar
        menuRef={createRef()}
        openMenu={null}
        setOpenMenu={setOpenMenu}
        onSettings={vi.fn()}
        onImportAlbum={onImportAlbum}
        onAddTrack={onAddTrack}
        onArchive={onArchive}
      />,
    );

    await user.click(screen.getByRole("button", { name: "File" }));
    expect(setOpenMenu).toHaveBeenCalledWith("file");

    rerender(
      <MenuBar
        menuRef={createRef()}
        openMenu="file"
        setOpenMenu={setOpenMenu}
        onSettings={vi.fn()}
        onImportAlbum={onImportAlbum}
        onAddTrack={onAddTrack}
        onArchive={onArchive}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Import Album…" }));
    await user.click(screen.getByRole("button", { name: "Add Track…" }));
    await user.click(screen.getByRole("button", { name: "OpenChord Archive…" }));

    expect(onImportAlbum).toHaveBeenCalledOnce();
    expect(onAddTrack).toHaveBeenCalledOnce();
    expect(onArchive).toHaveBeenCalledOnce();
  });
});

describe("Sidebar", () => {
  it("navigates to tracks and shows the configured server", async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    render(<Sidebar view="albums" navigate={navigate} serverUrl="https://music.example" />);

    expect(screen.getByText("music.example")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Треки" }));
    expect(navigate).toHaveBeenCalledWith("tracks");
  });
});

#!/usr/bin/env python3
"""Check local rendered HTML links, images, and fragment targets."""
import argparse
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.ids = set()
        self.links = []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            self.ids.add(attrs["id"])
        if tag == "a" and "name" in attrs:
            self.ids.add(attrs["name"])
        if tag == "a" and "href" in attrs:
            self.links.append(attrs["href"])
        if tag == "img" and "src" in attrs:
            self.links.append(attrs["src"])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("site_dir", type=Path)
    root = parser.parse_args().site_dir.resolve()
    pages = {path: Page(path.read_text(encoding="utf-8"))
             for path in root.rglob("*.html")}
    if not pages:
        parser.error("site_dir must contain rendered HTML pages")
    errors = []
    checked = 0
    for path, page in pages.items():
        for link in page.links:
            url = urlsplit(link)
            if url.scheme or url.netloc or (not url.path and not url.fragment):
                continue
            target = (path.parent / unquote(url.path)).resolve() if url.path else path
            if url.path.startswith("/"):
                target = (root / unquote(url.path.lstrip("/"))).resolve()
            if target.is_dir():
                target /= "index.html"
            checked += 1
            if not target.exists():
                errors.append((path.relative_to(root), link, "missing file"))
            elif (url.fragment and target in pages
                  and unquote(url.fragment) not in pages[target].ids):
                errors.append((path.relative_to(root), link, "missing anchor"))
    print(f"Checked {checked} local rendered links/images across {len(pages)} "
          f"HTML pages; failures: {len(errors)}")
    for path, link, reason in errors:
        print(f"{path}: {link}: {reason}")
    return int(bool(errors))


if __name__ == "__main__":
    raise SystemExit(main())

// Structured data, as a script the crawler reads and the reader never sees.
//
// `application/ld+json` is not executed, and the content is ours rather than a
// visitor's — but it is still JSON going into an HTML document, so `<` is
// escaped: a "</script>" inside any string would otherwise end the element
// early and the rest of the object would land in the page as markup.
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: the only way to emit ld+json
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

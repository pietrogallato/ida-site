import Image from "next/image";
import type { PortableTextComponents } from "@portabletext/react";

export const portableTextComponents: PortableTextComponents = {
  block: {
    h2: ({ children }) => (
      <h2 className="mt-10 mb-4 font-heading text-2xl font-semibold text-foreground">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-8 mb-3 font-heading text-xl font-semibold text-foreground">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="mt-6 mb-2 font-heading text-lg font-semibold text-foreground">
        {children}
      </h4>
    ),
    normal: ({ children }) => (
      <p className="mb-4 leading-relaxed text-foreground-muted">{children}</p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-6 border-l-[3px] border-l-primary pl-4 italic text-foreground-muted">
        {children}
      </blockquote>
    ),
  },
  marks: {
    link: ({ children, value }) => {
      // Whitelist safe URL schemes. An editor with CMS access could otherwise
      // set href="javascript:..." and turn a Sanity post into an XSS vector.
      // Security audit F-22.
      const href: string | undefined = value?.href;
      const isSafe =
        typeof href === "string" &&
        /^(https?:|mailto:|tel:|\/|#)/i.test(href.trim());
      if (!isSafe) {
        return (
          <span className="text-foreground-muted">{children}</span>
        );
      }
      const isExternal = href!.startsWith("http");
      return (
        <a
          href={href}
          className="text-primary-text underline decoration-primary/30 hover:text-primary-dark hover:decoration-primary"
          {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {children}
        </a>
      );
    },
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mb-4 ml-6 list-disc space-y-1 text-foreground-muted">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="mb-4 ml-6 list-decimal space-y-1 text-foreground-muted">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li>{children}</li>,
    number: ({ children }) => <li>{children}</li>,
  },
  types: {
    image: ({ value }) => {
      if (!value?.url) return null;
      return (
        <figure className="my-8">
          <Image
            src={value.url}
            alt={value.alt || ""}
            width={value.dimensions?.width || 800}
            height={value.dimensions?.height || 450}
            className="rounded-lg"
          />
          {value.alt && (
            <figcaption className="mt-2 text-center text-sm text-foreground-subtle">
              {value.alt}
            </figcaption>
          )}
        </figure>
      );
    },
  },
};

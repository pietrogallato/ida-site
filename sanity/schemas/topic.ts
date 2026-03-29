import { defineType, defineField } from "sanity";

export const topic = defineType({
  name: "topic",
  title: "Argomento",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Titolo",
      type: "object",
      fields: [
        { name: "it", title: "Italiano", type: "string", validation: (r) => r.required() },
        { name: "en", title: "English", type: "string", validation: (r) => r.required() },
      ],
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title.it", maxLength: 96 },
      validation: (r) => r.required(),
    }),
  ],
  preview: {
    select: { title: "title.it" },
  },
});

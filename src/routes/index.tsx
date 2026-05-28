import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ateliê de Desenho — Paint Infantil" },
      {
        name: "description",
        content:
          "Ateliê de Desenho: aplicativo de pintura infantil educacional. Desenhe, carimbe, use cores e salve seu desenho.",
      },
    ],
  }),
});

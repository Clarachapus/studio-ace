"use client";

import { useState } from "react";
import type { ArchitecturePage } from "@/lib/content/schemas";
import { Card, SaveBar, describeIssues, putJson, type SaveStatus } from "./FormKit";
import { ImageUploader } from "./ImageUploader";

/** Images of the Architecture page slideshow (one every two seconds, in this order). */
export function ArchitectureForm({ initial }: { initial: ArchitecturePage }) {
  const [images, setImages] = useState<string[]>(initial.images);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [errors, setErrors] = useState<string[]>([]);

  async function save() {
    setStatus("saving");
    setErrors([]);
    const result = await putJson("/api/admin/architecture", { images });
    if (result.ok) setStatus("saved");
    else {
      setStatus("error");
      setErrors(describeIssues(result.issues));
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-4xl">Page Architecture</h1>
      <p className="mt-2 text-ink-soft">
        Les images défilent au centre de la page, une toutes les 2 secondes, sous « Site en construction ». Ajoute, retire ou change l&apos;ordre, puis clique sur « Enregistrer ».
      </p>
      <div className="mt-8">
        <Card title="Images qui défilent" help="Plans ou photos. Les flèches changent l'ordre, la croix retire l'image.">
          <ImageUploader
            kind="architecture"
            slug="diaporama"
            images={images}
            onChange={(next) => {
              if (status === "saved") setStatus("idle");
              setImages(next);
            }}
            label="Images"
          />
        </Card>
      </div>
      <SaveBar status={status} errors={errors} onSave={save} />
    </div>
  );
}

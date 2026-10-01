import { listMedia } from "@ihern/core/blog";
import { mediaPath, mediaUrl } from "@ihern/core/blog-paths";
import { ActionForm, Submit } from "@/components/admin/Forms";
import ActionButton from "@/components/admin/ActionButton";
import UploadForm from "@/components/admin/UploadForm";
import { deleteMediaAction, updateAltAction } from "../actions";
import { u } from "@/lib/paths";

export const metadata = { title: "Images & files" };
export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const media = await listMedia(500);
  return (
    <>
      <header className="adm-head"><h1>Images &amp; files</h1></header>
      <section className="adm-card">
        <h2>Upload</h2>
        <UploadForm />
      </section>
      {!media ? (
        <p className="adm-flash adm-flash--error">The database could not be reached.</p>
      ) : (
        <div className="adm-media-grid">
          {media.map((m) => (
            <figure key={m.id} className="adm-card adm-media-card">
              {m.mime.startsWith("image/") ? <img src={u(mediaPath(m.path, 320))} alt={m.alt} loading="lazy" /> : <div className="adm-file">PDF</div>}
              <figcaption>
                <span className="adm-media-name" title={m.path}>{m.title || m.path.split("/").pop()}</span>
                <span className="adm-muted">{m.width && m.height ? `${m.width}×${m.height} · ` : ""}{m.size ? `${Math.round(m.size / 1024)} KB` : ""}</span>
                <input readOnly value={mediaUrl(m.path)} aria-label="Address" className="adm-copy" />
                {m.mime.startsWith("image/") ? (
                  <ActionForm action={updateAltAction} className="adm-form adm-form--row">
                    <input type="hidden" name="id" value={m.id} />
                    <input name="alt" defaultValue={m.alt} placeholder="Description for screen readers" aria-label="Alt text" maxLength={500} />
                    <Submit label="Save" className="adm-btn adm-btn--small" />
                  </ActionForm>
                ) : null}
                <ActionButton action={deleteMediaAction.bind(null, m.id)} label="Delete" className="adm-link adm-danger" confirm="Delete this file? It cannot be undone." />
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </>
  );
}

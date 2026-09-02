"use client";

import type JSZip from "jszip";

type ImageEntry = {
  rowNumber: number;
  file: File;
};

export async function extractExcelImagesByRow(file: File) {
  const images = new Map<number, File>();
  try {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(file);
    const workbookXml = await zip.file("xl/workbook.xml")?.async("text");
    const workbookRelsXml = await zip.file("xl/_rels/workbook.xml.rels")?.async("text");
    if (!workbookXml || !workbookRelsXml) return images;

    const firstSheetPath = resolveFirstSheetPath(workbookXml, workbookRelsXml);
    if (!firstSheetPath) return images;

    const sheetXml = await zip.file(firstSheetPath)?.async("text");
    const sheetRelsXml = await zip.file(relsPathFor(firstSheetPath))?.async("text");
    if (!sheetXml || !sheetRelsXml) return images;

    const drawingPath = resolveDrawingPath(sheetXml, sheetRelsXml, firstSheetPath);
    if (!drawingPath) return images;

    const drawingXml = await zip.file(drawingPath)?.async("text");
    const drawingRelsXml = await zip.file(relsPathFor(drawingPath))?.async("text");
    if (!drawingXml || !drawingRelsXml) return images;

    const entries = await readDrawingImages(zip, drawingXml, drawingRelsXml, drawingPath);
    for (const entry of entries) {
      if (!images.has(entry.rowNumber)) images.set(entry.rowNumber, entry.file);
    }
  } catch {
    return images;
  }
  return images;
}

function resolveFirstSheetPath(workbookXml: string, relsXml: string) {
  const sheetRid = workbookXml.match(/<sheet\b[^>]*r:id="([^"]+)"/)?.[1];
  if (!sheetRid) return "";
  const target = relationshipTarget(relsXml, sheetRid);
  if (!target) return "";
  return normalizeZipPath("xl", target);
}

function resolveDrawingPath(sheetXml: string, relsXml: string, sheetPath: string) {
  const drawingRid = sheetXml.match(/<drawing\b[^>]*r:id="([^"]+)"/)?.[1];
  if (!drawingRid) return "";
  const target = relationshipTarget(relsXml, drawingRid);
  if (!target) return "";
  return normalizeZipPath(parentDir(sheetPath), target);
}

async function readDrawingImages(zip: JSZip, drawingXml: string, relsXml: string, drawingPath: string) {
  const entries: ImageEntry[] = [];
  const anchors = drawingXml.match(/<xdr:(?:twoCellAnchor|oneCellAnchor)[\s\S]*?<\/xdr:(?:twoCellAnchor|oneCellAnchor)>/g) || [];

  for (const anchor of anchors) {
    const rowIndex = Number(anchor.match(/<xdr:from>[\s\S]*?<xdr:row>(\d+)<\/xdr:row>/)?.[1]);
    const relId = anchor.match(/<a:blip\b[^>]*(?:r:embed|r:link)="([^"]+)"/)?.[1];
    if (!Number.isFinite(rowIndex) || !relId) continue;

    const target = relationshipTarget(relsXml, relId);
    if (!target) continue;

    const mediaPath = normalizeZipPath(parentDir(drawingPath), target);
    const media = zip.file(mediaPath);
    if (!media) continue;

    const blob = await media.async("blob");
    const mimeType = mimeFromPath(mediaPath);
    const extension = extensionFromMime(mimeType);
    entries.push({
      rowNumber: rowIndex + 1,
      file: new File([blob], `excel-image-${rowIndex + 1}.${extension}`, { type: mimeType }),
    });
  }

  return entries;
}

function relationshipTarget(relsXml: string, id: string) {
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return relsXml.match(new RegExp(`<Relationship\\b[^>]*Id="${escapedId}"[^>]*Target="([^"]+)"`, "i"))?.[1] || "";
}

function relsPathFor(path: string) {
  const slash = path.lastIndexOf("/");
  const dir = slash >= 0 ? path.slice(0, slash) : "";
  const file = slash >= 0 ? path.slice(slash + 1) : path;
  return `${dir}/_rels/${file}.rels`;
}

function parentDir(path: string) {
  const slash = path.lastIndexOf("/");
  return slash >= 0 ? path.slice(0, slash) : "";
}

function normalizeZipPath(base: string, target: string) {
  const raw = target.startsWith("/") ? target.slice(1) : `${base}/${target}`;
  const parts: string[] = [];
  for (const part of raw.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") parts.pop();
    else parts.push(part);
  }
  return parts.join("/");
}

function mimeFromPath(path: string) {
  const lower = path.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

function extensionFromMime(mimeType: string) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/gif") return "gif";
  return "jpg";
}

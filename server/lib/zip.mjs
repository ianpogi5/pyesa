import { inflateRawSync } from "node:zlib";

const EOCD_SIG = 0x06054b50;
const CENTRAL_SIG = 0x02014b50;

/**
 * Minimal zip reader — enough to extract the entries of a SongbookPro
 * .sbp backup (a handful of small deflate/stored files). Avoids pulling
 * a zip dependency into the Lambda bundle.
 *
 * Returns a Map of entry name → Buffer of uncompressed content.
 */
export function readZip(buffer) {
  // Find End Of Central Directory record (scan backwards, comment can pad it)
  let eocd = -1;
  for (let i = buffer.length - 22; i >= 0; i--) {
    if (buffer.readUInt32LE(i) === EOCD_SIG) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("Not a zip file (no end-of-central-directory)");

  const entryCount = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16); // central directory offset

  const entries = new Map();
  for (let i = 0; i < entryCount; i++) {
    if (buffer.readUInt32LE(offset) !== CENTRAL_SIG) {
      throw new Error("Corrupt zip: bad central directory entry");
    }
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer
      .subarray(offset + 46, offset + 46 + nameLength)
      .toString("utf-8");

    // Local header: name/extra lengths there may differ from central directory
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const data = buffer.subarray(dataStart, dataStart + compressedSize);

    if (method === 0) {
      entries.set(name, Buffer.from(data));
    } else if (method === 8) {
      entries.set(name, inflateRawSync(data));
    } else {
      throw new Error(`Unsupported zip compression method ${method} (${name})`);
    }

    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

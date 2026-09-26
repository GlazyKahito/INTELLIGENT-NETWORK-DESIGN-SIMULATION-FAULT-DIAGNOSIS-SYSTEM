// Hamming (7,4) Error Detection and Correction Library

export interface HammingCalculationResult {
  dataBits: number[]; // 4 bits [d3, d2, d1, d0] or [d1, d2, d3, d4]
  p1: number; // parity for bits 1, 3, 5, 7
  p2: number; // parity for bits 2, 3, 6, 7
  p4: number; // parity for bits 4, 5, 6, 7
  encodedBits: number[]; // 7 bits (positions 1 to 7)
  p1Coverage: number[]; // bit positions covered by P1: [1, 3, 5, 7]
  p2Coverage: number[]; // bit positions covered by P2: [2, 3, 6, 7]
  p4Coverage: number[]; // bit positions covered by P4: [4, 5, 6, 7]
}

export interface HammingSyndromeResult {
  receivedBits: number[]; // 7 bits
  s1: number; // p1' ^ b3 ^ b5 ^ b7
  s2: number; // p2' ^ b3 ^ b6 ^ b7
  s4: number; // p4' ^ b5 ^ b6 ^ b7
  syndromeDecimal: number; // s4 * 4 + s2 * 2 + s1
  hasError: boolean;
  errorPosition: number; // 1-7 or 0 if none
  correctedBits: number[];
}

/**
 * Standard (7,4) Hamming Code with Even Parity:
 * Bit Positions:
 * 1: P1
 * 2: P2
 * 3: D1 (data bit 1)
 * 4: P4
 * 5: D2 (data bit 2)
 * 6: D3 (data bit 3)
 * 7: D4 (data bit 4)
 */
export function encodeHamming74(d1: number, d2: number, d3: number, d4: number): HammingCalculationResult {
  // P1 covers bits 1, 3, 5, 7 -> P1 ^ D1 ^ D2 ^ D4 = 0 => P1 = D1 ^ D2 ^ D4
  const p1 = (d1 ^ d2 ^ d4) & 1;

  // P2 covers bits 2, 3, 6, 7 -> P2 ^ D1 ^ D3 ^ D4 = 0 => P2 = D1 ^ D3 ^ D4
  const p2 = (d1 ^ d3 ^ d4) & 1;

  // P4 covers bits 4, 5, 6, 7 -> P4 ^ D2 ^ D3 ^ D4 = 0 => P4 = D2 ^ D3 ^ D4
  const p4 = (d2 ^ d3 ^ d4) & 1;

  // 1-indexed representation stored in array index 0..6
  // [P1, P2, D1, P4, D2, D3, D4]
  const encodedBits = [p1, p2, d1, p4, d2, d3, d4];

  return {
    dataBits: [d1, d2, d3, d4],
    p1,
    p2,
    p4,
    encodedBits,
    p1Coverage: [1, 3, 5, 7],
    p2Coverage: [2, 3, 6, 7],
    p4Coverage: [4, 5, 6, 7],
  };
}

export function decodeHamming74(receivedBits: number[]): HammingSyndromeResult {
  if (receivedBits.length !== 7) {
    throw new Error('Hamming (7,4) requires exactly 7 bits');
  }

  // Bit indices: 0 is bit 1, 1 is bit 2, ..., 6 is bit 7
  const b1 = receivedBits[0]; // P1
  const b2 = receivedBits[1]; // P2
  const b3 = receivedBits[2]; // D1
  const b4 = receivedBits[3]; // P4
  const b5 = receivedBits[4]; // D2
  const b6 = receivedBits[5]; // D3
  const b7 = receivedBits[6]; // D4

  // Check Parity 1 (bits 1, 3, 5, 7)
  const s1 = (b1 ^ b3 ^ b5 ^ b7) & 1;

  // Check Parity 2 (bits 2, 3, 6, 7)
  const s2 = (b2 ^ b3 ^ b6 ^ b7) & 1;

  // Check Parity 4 (bits 4, 5, 6, 7)
  const s4 = (b4 ^ b5 ^ b6 ^ b7) & 1;

  // Syndrome Word S = (s4 s2 s1)_2
  const syndromeDecimal = s4 * 4 + s2 * 2 + s1;
  const hasError = syndromeDecimal !== 0;
  const errorPosition = syndromeDecimal; // 1-indexed bit position

  const correctedBits = [...receivedBits];
  if (hasError && errorPosition >= 1 && errorPosition <= 7) {
    // Flip the corrupted bit (0-indexed position is errorPosition - 1)
    correctedBits[errorPosition - 1] = correctedBits[errorPosition - 1] === 1 ? 0 : 1;
  }

  return {
    receivedBits: [...receivedBits],
    s1,
    s2,
    s4,
    syndromeDecimal,
    hasError,
    errorPosition,
    correctedBits,
  };
}

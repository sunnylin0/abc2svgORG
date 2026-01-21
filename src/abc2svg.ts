// abc2svg - Core definitions and constants
// Ported from abc2svg-1.js

export const C = {
    BLEN: 1536,

    // symbol types
    BAR: 0,
    CLEF: 1,
    CUSTOS: 2,
    SM: 3,		// sequence marker (transient)
    GRACE: 4,
    KEY: 5,
    METER: 6,
    MREST: 7,
    NOTE: 8,
    PART: 9,
    REST: 10,
    SPACE: 11,
    STAVES: 12,
    STBRK: 13,
    TEMPO: 14,
    BLOCK: 16,
    REMARK: 17,

    // note heads
    FULL: 0,
    EMPTY: 1,
    OVAL: 2,
    OVALBARS: 3,
    SQUARE: 4,

    // position types
    SL_ABOVE: 0x01,		// position (3 bits)
    SL_BELOW: 0x02,
    SL_AUTO: 0x03,
    SL_HIDDEN: 0x04,
    SL_DOTTED: 0x08,	// modifiers
    SL_ALI_MSK: 0x70,	// align
    SL_ALIGN: 0x10,
    SL_CENTER: 0x20,
    SL_CLOSE: 0x40,

    // limit for y offset arrays
    YSTEP: 4096
};

export const sym_name = ['bar', 'clef', 'custos', 'smark', 'grace',
    'key', 'meter', 'Zrest', 'note', 'part',
    'rest', 'yspace', 'staves', 'Break', 'tempo',
    '', 'block', 'remark'];

// key table - index = number of accidentals + 7
export const keys = [
    new Int8Array([-1, -1, -1, -1, -1, -1, -1]),	// 7 flat signs
    new Int8Array([-1, -1, -1, 0, -1, -1, -1]),	// 6 flat signs
    new Int8Array([0, -1, -1, 0, -1, -1, -1]),	// 5 flat signs
    new Int8Array([0, -1, -1, 0, 0, -1, -1]),	// 4 flat signs
    new Int8Array([0, 0, -1, 0, 0, -1, -1]),	// 3 flat signs
    new Int8Array([0, 0, -1, 0, 0, 0, -1]),	// 2 flat signs
    new Int8Array([0, 0, 0, 0, 0, 0, -1]),	// 1 flat signs
    new Int8Array([0, 0, 0, 0, 0, 0, 0]),	// no accidental
    new Int8Array([0, 0, 0, 1, 0, 0, 0]),	// 1 sharp signs
    new Int8Array([1, 0, 0, 1, 0, 0, 0]),	// 2 sharp signs
    new Int8Array([1, 0, 0, 1, 1, 0, 0]),	// 3 sharp signs
    new Int8Array([1, 1, 0, 1, 1, 0, 0]),	// 4 sharp signs
    new Int8Array([1, 1, 0, 1, 1, 1, 0]),	// 5 sharp signs
    new Int8Array([1, 1, 1, 1, 1, 1, 0]),	// 6 sharp signs
    new Int8Array([1, 1, 1, 1, 1, 1, 1])	// 7 sharp signs
];

// base-40 representation of musical pitch
// (http://www.ccarh.org/publications/reprints/base40/)
export const p_b40 = new Int8Array(			// staff pitch to base-40
    //		  C  D   E   F   G   A   B
    [2, 8, 14, 19, 25, 31, 37]);

export const b40_p = new Int8Array(			// base-40 to staff pitch
    //		       C		 D
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1,
        //	      E		     F		       G
        2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4,
        //	      A			B
        5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6]);

export const b40_a = new Int8Array(			// base-40 to accidental
    //		         C		      D
    [-2, -1, 0, 1, 2, -3, -2, -1, 0, 1, 2, -3,
    //		E		 F		      G
    -2, -1, 0, 1, 2, -2, -1, 0, 1, 2, -3, -2, -1, 0, 1, 2, -3,
    //		A		     B
    -2, -1, 0, 1, 2, -3, -2, -1, 0, 1, 2]);

export const b40_m = new Int8Array(			// base-40 to midi
    //			 C		   D
    [-2, -1, 0, 1, 2, 0, 0, 1, 2, 3, 4, 0,
        //	      E		     F		       G
        2, 3, 4, 5, 6, 3, 4, 5, 6, 7, 0, 5, 6, 7, 8, 9, 0,
        //	      A			    B
        7, 8, 9, 10, 11, 0, 9, 10, 11, 12, 13]);

export const b40l5 = new Int8Array([			// base-40 to line of fifth
    //		  C			  D
    -14, -7, 0, 7, 14, 0, -12, -5, 2, 9, 16, 0,
    //		  E		      F			      G	
    -10, -3, 4, 11, 18, -15, -8, -1, 6, 13, 0, -13, -6, 1, 8, 15, 0,
    //		  A			  B
    -11, -4, 3, 10, 17, 0, -9, -2, 5, 12, 19]);

export const isb40 = new Int8Array(		// interval with sharp to base-40 interval
    [0, 1, 6, 7, 12, 17, 18, 23, 24, 29, 30, 35]);

export function pab40(p: number, a?: number) {
    p += 19				// staff pitch from C-1
    var b40 = ((p / 7) | 0) * 40 + p_b40[p % 7]
    if (a && a != 3)		// if some accidental, but not natural
        b40 += a
    return b40
} // pit2b40()

export function b40p(b: number) {
    return ((b / 40) | 0) * 7 + b40_p[b % 40] - 19
} // b40p()

export function b40a(b: number) {
    return b40_a[b % 40]
} // b40a()

export function b40m(b: number) {
    return ((b / 40) | 0) * 12 + b40_m[b % 40]
} // b40m()

export const ch_alias: { [key: string]: string } = {
    "maj": "",
    "min": "m",
    "-": "m",
    "°": "dim",
    "+": "aug",
    "+5": "aug",
    "maj7": "M7",
    "Δ7": "M7",
    "Δ": "M7",
    "min7": "m7",
    "-7": "m7",
    "ø7": "m7b5",
    "°7": "dim7",
    "min+7": "m+7",
    "aug7": "+7",
    "7+5": "+7",
    "7#5": "+7",
    "sus": "sus4",
    "7sus": "7sus4"
} // ch_alias

// global fonts
export const font_tb: any[] = []	// fonts - index = font.fid
export const font_st: { [key: string]: any } = {}	// font style => font_tb index for incomplete user fonts

// cache for converting a duration into [head, dots, nflags]
export const hdn: { [key: string]: any } = {}

// font weight
export const ft_w: { [key: string]: number } = {
    thin: 100,
    extralight: 200,
    light: 300,
    regular: 400,
    medium: 500,
    semi: 600,
    demi: 600,
    semibold: 600,
    demibold: 600,
    bold: 700,
    extrabold: 800,
    ultrabold: 800,
    black: 900,
    heavy: 900
}

export const ft_re = new RegExp('\
-?Thin|-?Extra Light|-?Light|-?Regular|-?Medium|\
-?[DS]emi|-?[DS]emi[ -]?Bold|\
-?Bold|-?Extra[ -]?Bold|-?Ultra[ -]?Bold|-?Black|-?Heavy/',
    "i")

// lyric prefix
export const lypre = /^\d.+\.|^[\d-]+\.?|^\w+:|^\(|^\)/;

// simplify a rational number n/d
export function rat(n: number, d: number) {
    var a, t,
        n0 = 0,
        d1 = 0,
        n1 = 1,
        d0 = 1
    while (1) {
        if (d == 0)
            break
        t = d
        a = (n / d) | 0
        d = n % d
        n = t
        t = n0 + a * n1
        n0 = n1
        n1 = t
        t = d0 + a * d1
        d0 = d1
        d1 = t
    }
    return [n1, d1]
} // rat()

// compare pitches
// This function is used to sort the note pitches
export function pitcmp(n1: any, n2: any) { return n1.pit - n2.pit }

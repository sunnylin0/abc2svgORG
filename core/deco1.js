var dd_tb = {}, 
  a_de, 
  cross;

// decorations - populate with standard decorations
var decos = {
    dot: '0 stc 6 .7 1',
    tenuto: '0 emb 6 4 3',
    slide: '1 sld 5,5 7 1',
    arpeggio: '2 arp 12 10 3',
    roll: '3 roll 5,4 5 6',
    lowermordent: '3 lmrd 6,5 4 6',
    uppermordent: '3 umrd 6,5 4 6',
    sacc3: '3 sacc3 6,5 4 4',
    sacc1: '3 sacc1 6,4 4 4',
    courtesy: '43 0 0 0 0',
    'cacc-1': '3 cacc-1 0 0 0',
    cacc3: '3 cacc3 0 0 0',
    cacc1: '3 cacc1 0 0 0',
    'tie(': '44 0 0 0 0',
    'tie)': '44 0 0 0 0',
    fg: '45 0 0 0 0',
  },
  // types of decoration per function
  f_near = [
    d_near, // 0 - near the note
    d_slide, // 1 - slide or tied to the note stem
    d_arp, // 2 - arpeggio
  ],
  f_note = [
    null,
    null,
    null,
    null,
    d_upstaff, // 4 (below the staff)
  ],
  f_staff = [
    null,
    null,
    null,
    d_upstaff, // 3 - tied to note
    null,
    d_upstaff, // 5 (above the staff)
    d_upstaff, // 6 - tied to staff (dynamic marks)
    d_upstaff, // 7 (below the staff)
  ];



// get the staff position
// - of the ornaments
function up3(s, pos) {
  switch (pos & 0x07) {
    case C.SL_ABOVE:
      return 1; // true
    case C.SL_BELOW:
      return 0; // false
  }

  dd_tb = 98;
  return s.multi > 0 || !s.second;
} // up3()


/* -- drawing functions -- */
/* 2: special case for arpeggio */
function d_arp(de) {
  var m,
    h,
    dx,
    s = de.s,
    dd = de.dd,
    xc = dd.wr;

  if (s.type == C.NOTE) {
    for (m = 0; m <= s.nhd; m++) {
      if (s.notes[m].acc) {
        dx = s.notes[m].shac;
      } else {
        dx = 1 - s.notes[m].shhd;
        switch (s.head) {
          case C.SQUARE:
            dx += 3.5;
            break;
          case C.OVALBARS:
          case C.OVAL:
            dx += 2;
            break;
        }
      }
      if (dx > xc) xc = dx;
    }
  }
  h = 3 * (s.notes[s.nhd].pit - s.notes[0].pit) + 4;
  m = dd.h; /* minimum height */
  if (h < m) h = m;

  de.has_val = true;
  de.val = h;
  //	de.x = s.x - xc;
  de.x -= xc;
  de.y = 3 * ((s.notes[0].pit + s.notes[s.nhd].pit) / 2 - 18) - h / 2 - 3;
}


// special case for long decoration
function d_trill(de) {
  if (de.ldst) return;
  var y,
    w,
    tmp,
    dd = de.dd,
    de2 = de.prev,
    up = de.start.up,
    s2 = de.s,
    st = s2.st,
    s = de.start.s,
    x = s.x;

  dd_tb = 19;
  // shift the starting point of a long decoration
  // in the cases "T!trill(!" and "!pp!!<(!"
  // (side effect on x)
  function sh_st() {
    var de3,
      de2 = de.start, // start of the decoration
      s = de2.s,
      i = de2.ix; // index of the current decoration

    while (--i >= 0) {
      de3 = a_de[i];
      if (!de3 || de3.s != s) break;
    }
    while (1) {
      // loop on the decorations of the symbol
      i++;
      de3 = a_de[i];
      if (!de3 || de3.s != s) break;
      if (de3 == de2) continue;
      if (!(up ^ de3.up) && (de3.dd.name == 'trill' || de3.dd.func == 6)) {
        // dynamic
        x += de3.dd.wr + 2;
        break;
      }
    }
  } // sh_st()

  // shift the ending point of a long decoration
  // (side effect on w)
  function sh_en() {
    var de3,
      i = de.ix; // index of the current decoration

    while (--i > 0) {
      de3 = a_de[i];
      if (!de3 || de3.s != s2) break;
    }
    while (1) {
      // loop on the decorations of the symbol
      i++;
      de3 = a_de[i];
      if (!de3 || de3.s != s2) break;
      //			if (de3 == de || de3 == de2)
      if (de3 == de) continue;
      if (!(up ^ de3.up) && de3.dd.func == 6) {
        // if dynamic mark
        w -= de3.dd.wl;
        break;
      }
    }
  } //sh_en()

  // d_trill()
  if (de2) {
    // same height
    x = de2.s.x + de.dd.wl + 2;
    de2.val -= de2.dd.wr;
    if (de2.val < 8) de2.val = 8;
  }
  de.st = st;
  de.up = up;

  sh_st(); // shift the starting point?

  if (de.defl.noen) {
    /* if no decoration end */
    w = de.x - x;
    if (w < 20) {
      x = de.x - 20 - 3;
      w = 20;
    }
  } else {
    w = s2.x - x - 4;
    sh_en(de); // shift the ending point?
    if (w < 20) w = 20;
  }
  y = y_get(st, up, x - dd.wl, w);
  if (up) {
    tmp = staff_tb[s.st].topbar + 2;
    if (y < tmp) y = tmp;
  } else {
    tmp = staff_tb[s.st].botbar - 2;
    if (y > tmp) y = tmp;
    y -= dd.h;
  }
  if (de2) {
    // if same height
    if (up) {
      if (y < de2.y) y = de2.y; // (only on one note)
    } else {
      if (y >= de2.y) {
        y = de2.y;
      } else {
        do {
          de2.y = y;
          de2 = de2.prev; // go backwards
        } while (de2);
      }
    }
  }

  de.lden = false;
  de.has_val = true;
  de.val = w;
  de.x = x;
  de.y = y;
  if (up) y += dd.h;
  else y -= dd.hd;
  y_set(st, up, x, w, y);
  if (up) s.ymx = s2.ymx = y;
  else s.ymn = s2.ymn = y;
}


// define a cross-voice tie
// @nm = decoration name
// @s = note symbol
// @nt1 = note
function do_ctie(nm, s, nt1) {
  var nt2 = cross[nm],
    nm2 = nm.slice(0, -1) + (nm.slice(-1) == '(' ? ')' : '(');

  if (nt2) {
    error(1, s, 'Conflict on !$1!', nm);
    return;
  }
  if (nt1.tie_ty)
    // if normal '-'
    curvoice.tie_s = null;

  nt1.s = s;
  nt2 = cross[nm2];
  if (!nt2) {
    cross[nm] = nt1; // keep the start/end
    return;
  }
  if (nm.slice(-1) == ')') {
    nt2 = nt1;
    nt1 = cross[nm2];
  }
  cross[nm2] = null;
  if (nt1.midi != nt2.midi || nt1.s.time + nt1.dur != nt2.s.time) {
    error(1, s, 'Bad tie');
  } else {
    if (!nt1.tie_ty)
      // if not normal '-'
      nt1.tie_ty = C.SL_AUTO;
    nt1.tie_e = nt2;
    nt2.tie_s = nt1;
    nt1.s.ti1 = nt2.s.ti2 = true;
  }
} // do_ctie()


function dh_cnv(s, nt) {
  var k, nm, dd;

  while (1) {
    nm = a_dcn.shift();
    if (!nm) break;
    dd = get_dd(nm);
    if (!dd) continue;

    switch (dd.func) {
      case 1: // slide
      case 3:
      case 8: // gliss
        break;
      default:
        error(1, s, 'Cannot have !$1! on a head', nm);
        continue;
      case 9: // head replacement
        nt.invis = true;
        break;
      case 32: // invisible
        nt.invis = true;
        continue;
      case 10: // color
        nt.color = nm;
        continue;
      case 40: // stemless chord (abcm2ps behaviour)
        s.stemless = true;
        continue;
      case 44: // cross-voice ties
        do_ctie(nm, s, nt);
        continue;
    }

    // add the decoration in the note
    if (!nt.a_dd) nt.a_dd = [];
    nt.a_dd.push(dd);
  }
} // dh_cnv()
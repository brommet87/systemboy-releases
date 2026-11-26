// SystemBoy – Website-Effekte · © 2026 Christoph Reit – reit.codes. Alle Rechte vorbehalten.
// Ohne Tracking, ohne Fremdskripte: nur Darstellung.
;(() => {
  "use strict"
  // Alte Adresse „/#download“ (steht in signierten Statusdateien und im Online-Installer): Die Startseite hat keinen
  // Download-Abschnitt mehr – direkt zur Download-Seite der jeweiligen Sprache weiterleiten.
  if (location.hash === "#download") {
    const ziel = document.querySelector("a[data-os-knopf]")
    if (ziel) return location.replace(ziel.href)
  }
  const doc = document.documentElement
  doc.classList.add("js")
  const ruhig = matchMedia("(prefers-reduced-motion: reduce)").matches
  const fein = matchMedia("(pointer: fine)").matches

  // Hell/Dunkel: System (Standard) → Hell → Dunkel; Wahl bleibt im Browser gespeichert
  const themaKnopf = document.querySelector("[data-thema-knopf]")
  if (themaKnopf) {
    const reihe = ["system", "hell", "dunkel"]
    const lesen = () => {
      try {
        const w = localStorage.getItem("sb-thema")
        return reihe.includes(w) ? w : "system"
      } catch {
        return "system"
      }
    }
    const farbe = () => {
      const hell = doc.dataset.theme ? doc.dataset.theme === "light" : matchMedia("(prefers-color-scheme: light)").matches
      document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", hell ? "#f6f5ff" : "#0b0d1a"))
    }
    const anwenden = (wahl) => {
      if (wahl === "system") doc.removeAttribute("data-theme")
      else doc.setAttribute("data-theme", wahl === "hell" ? "light" : "dark")
      const d = themaKnopf.dataset
      const naechste = reihe[(reihe.indexOf(wahl) + 1) % reihe.length]
      const text = `${d.titel}: ${d[wahl]} (${d.weiter} ${d[naechste]})`
      themaKnopf.setAttribute("aria-label", text)
      themaKnopf.title = text
      farbe()
    }
    let wahl = lesen()
    anwenden(wahl)
    themaKnopf.addEventListener("click", () => {
      wahl = reihe[(reihe.indexOf(wahl) + 1) % reihe.length]
      try {
        if (wahl === "system") localStorage.removeItem("sb-thema")
        else localStorage.setItem("sb-thema", wahl)
      } catch {}
      anwenden(wahl)
    })
    matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => wahl === "system" && farbe())
  }

  // Kopfzeile beim Scrollen verglasen
  const kopf = document.querySelector(".kopf")
  const beimScrollen = () => kopf && kopf.classList.toggle("gescrollt", scrollY > 10)
  addEventListener("scroll", beimScrollen, { passive: true })
  beimScrollen()

  // Menü auf schmalen Bildschirmen
  const menueKnopf = document.querySelector("[data-menue-knopf]")
  const menue = document.getElementById("navi-seiten")
  if (menueKnopf && menue) {
    const setzen = (auf) => {
      menue.classList.toggle("offen", auf)
      menueKnopf.setAttribute("aria-expanded", String(auf))
    }
    menueKnopf.addEventListener("click", (e) => {
      e.stopPropagation()
      setzen(!menue.classList.contains("offen"))
    })
    document.addEventListener("click", (e) => {
      if (menue.classList.contains("offen") && (!menue.contains(e.target) || e.target.closest("a"))) setzen(false)
    })
    addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menue.classList.contains("offen")) {
        setzen(false)
        menueKnopf.focus()
      }
    })
    matchMedia("(min-width: 861px)").addEventListener("change", (e) => e.matches && setzen(false))
  }

  // Lichtkegel folgt der Maus; Glanz auf Karten
  if (fein && !ruhig) {
    let rahmen = 0
    addEventListener("pointermove", (e) => {
      cancelAnimationFrame(rahmen)
      rahmen = requestAnimationFrame(() => {
        doc.style.setProperty("--mx", e.clientX + "px")
        doc.style.setProperty("--my", e.clientY + "px")
      })
    }, { passive: true })
    document.querySelectorAll(".glanz, .os-karte").forEach((k) =>
      k.addEventListener("pointermove", (e) => {
        const r = k.getBoundingClientRect()
        k.style.setProperty("--gx", e.clientX - r.left + "px")
        k.style.setProperty("--gy", e.clientY - r.top + "px")
      }),
    )
    // 3D-Neigen von Demo-Fenster und Bildschirmfotos
    document.querySelectorAll(".neigen").forEach((el) => {
      const basis = el.classList.contains("demo-fenster") ? { x: 5, y: -9 } : { x: 0, y: 0 }
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect()
        const x = (e.clientX - r.left) / r.width - 0.5
        const y = (e.clientY - r.top) / r.height - 0.5
        el.style.transform = `rotateY(${basis.y + x * 12}deg) rotateX(${basis.x - y * 10}deg) translateZ(10px)`
      })
      el.addEventListener("pointerleave", () => (el.style.transform = ""))
    })
  }

  // Agent-Ablauf: Zeilen nacheinander einblenden, Schritte „arbeiten“ kurz, dann Schleife
  document.querySelectorAll(".ablauf").forEach((box) => {
    const zeilen = [...box.children]
    if (ruhig) return zeilen.forEach((z) => z.classList.add("an", "erledigt"))
    let laeuft = false
    const schleife = async () => {
      const warte = (ms) => new Promise((r) => setTimeout(r, ms))
      while (laeuft) {
        zeilen.forEach((z) => z.classList.remove("an", "erledigt", "gedrueckt"))
        await warte(700)
        for (const z of zeilen) {
          if (!laeuft) return
          z.classList.add("an")
          if (z.classList.contains("ab-schritt")) (await warte(1100), z.classList.add("erledigt"))
          else if (z.classList.contains("ab-frage")) (await warte(1300), z.classList.add("gedrueckt"), await warte(500))
          await warte(z.classList.contains("ab-text") ? 1400 : 700)
        }
        await warte(4200)
      }
    }
    new IntersectionObserver((e) => {
      const sichtbar = e[0].isIntersecting
      if (sichtbar && !laeuft) (laeuft = true), schleife()
      if (!sichtbar) laeuft = false
    }).observe(box)
  })

  // Einblenden beim Scrollen (gestaffelt)
  const beobachter = new IntersectionObserver(
    (eintraege) =>
      eintraege.forEach((e) => {
        if (!e.isIntersecting) return
        e.target.classList.add("sichtbar")
        beobachter.unobserve(e.target)
      }),
    { rootMargin: "0px 0px -8% 0px" },
  )
  document.querySelectorAll(".einblenden").forEach((el) => {
    const geschwister = [...el.parentElement.children].filter((x) => x.classList.contains("einblenden"))
    el.style.setProperty("--verz", Math.min(geschwister.indexOf(el), 8) * 0.07 + "s")
    beobachter.observe(el)
  })

  // Zahlen hochzählen
  const zaehler = new IntersectionObserver((eintraege) =>
    eintraege.forEach((e) => {
      if (!e.isIntersecting) return
      zaehler.unobserve(e.target)
      const el = e.target
      const text = el.textContent
      const m = text.match(/\d+/)
      if (!m || ruhig) return
      const ziel = +m[0]
      const start = performance.now()
      const schritt = (t) => {
        const p = Math.min(1, (t - start) / 1400)
        const wert = Math.round(ziel * (1 - Math.pow(1 - p, 3)))
        el.textContent = text.replace(m[0], wert)
        if (p < 1) requestAnimationFrame(schritt)
      }
      requestAnimationFrame(schritt)
    }),
  )
  document.querySelectorAll("[data-zaehlen]").forEach((el) => zaehler.observe(el))

  // Live-Demo: Gesprächsverlauf nacheinander abspielen, in Schleife
  const demo = document.querySelector("[data-demo]")
  if (demo) {
    const teile = [...demo.children]
    if (ruhig) demo.classList.add("statisch")
    else {
      const warte = (ms) => new Promise((r) => setTimeout(r, ms))
      const abspielen = async () => {
        for (;;) {
          teile.forEach((t) => t.classList.remove("zu-sehen", "fertig", "geklickt"))
          await warte(700)
          for (const t of teile) {
            t.classList.add("zu-sehen")
            if (t.classList.contains("d-tool")) {
              await warte(1300)
              t.classList.add("fertig")
            } else if (t.classList.contains("d-frage")) {
              await warte(1800)
              t.classList.add("geklickt")
              await warte(500)
            } else await warte(t.classList.contains("d-nutzer") ? 900 : 1900)
          }
          await warte(5000)
        }
      }
      // erst starten, wenn sichtbar
      const start = new IntersectionObserver((e) => {
        if (e[0].isIntersecting) {
          start.disconnect()
          abspielen()
        }
      })
      start.observe(demo)
    }
  }

  // Befehle kopieren (Linux-Installation)
  document.querySelectorAll("[data-kopieren]").forEach((b) =>
    b.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(b.dataset.kopieren)
        b.classList.add("ok")
        b.title = b.dataset.fertig
        setTimeout(() => b.classList.remove("ok"), 1500)
      } catch {}
    }),
  )

  // Werkzeug-Reiter
  const reiter = document.querySelectorAll("[data-reiter]")
  reiter.forEach((b) =>
    b.addEventListener("click", () => {
      reiter.forEach((x) => x.setAttribute("aria-selected", String(x === b)))
      document.querySelectorAll("[data-gruppe]").forEach((g) => (g.hidden = g.dataset.gruppe !== b.dataset.reiter))
    }),
  )

  // Betriebssystem erkennen: passenden Download hervorheben und im Hauptknopf nennen
  const ua = navigator.userAgent
  const plattform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || ""
  const os = /Win/i.test(plattform + ua) ? "win" : /Mac|iPhone|iPad/i.test(plattform + ua) ? "mac" : /Linux|X11/i.test(plattform + ua) && !/Android/i.test(ua) ? "linux" : null
  if (os) {
    const namen = { win: "Windows", mac: "macOS", linux: "Linux" }
    const karte = document.querySelector(`.os-karte[data-os="${os}"]`)
    if (karte) {
      karte.classList.add("empfohlen")
      karte.parentElement.prepend(karte)
      const erkannt = document.querySelector(".erkannt")
      if (erkannt) {
        erkannt.hidden = false
        erkannt.querySelector("[data-os-name]").textContent = namen[os]
      }
    }
    document.querySelectorAll("[data-os-knopf]").forEach((k) => {
      const span = k.querySelector("span")
      if (span) span.textContent += ` ${k.dataset.fuer} ${namen[os]}`
    })
  }
})()

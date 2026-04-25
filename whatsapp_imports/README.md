# WhatsApp imports

Drop raw WhatsApp chat exports or copy-pasted conversations here as `.txt` files.

The importer expects either:

## 1. WhatsApp "Export chat" format
```
[12/07/2024, 09:15:23] John Doe: On sera 4 demain matin
[12/07/2024, 09:18:00] Salt & Fin: Noté, à 10h ça vous va ?
```

## 2. Free-form copy/paste
```
Sana HNID - +216 22 345 678
"On sera 3 personnes dimanche"

Marc L. - +33 6 12 34 56 78
"Réservation samedi 15h, 2 pax"
```

Each `.txt` file is read by `src/scripts/master-sync.ts`. The full raw text is stored in
`customers.raw_data` so you can manually correct parsing later.

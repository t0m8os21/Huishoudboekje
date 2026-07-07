# Huishoudboekje

Een eenvoudige, privé website om maandelijks ING-afschriften (CSV) van jou en je partner in te laden, automatisch te categoriseren, en overzicht te krijgen in wie wat uitgeeft en hoeveel jullie samen sparen.

Alles draait volledig in de browser — er is geen server en geen database. Je bankgegevens verlaten je apparaat nooit.

## Op GitHub Pages zetten

1. Maak een nieuwe (private) GitHub-repository aan, bijvoorbeeld `huishoudboekje`.
2. Upload deze drie bestanden naar de root van de repository: `index.html`, `style.css`, `app.js` (en dit `README.md` mag ook mee).
3. Ga naar **Settings → Pages**.
4. Kies bij "Source" de branch `main` en map `/ (root)`, klik op **Save**.
5. Na een minuut is de site bereikbaar op `https://<jouw-gebruikersnaam>.github.io/huishoudboekje/`.

> Tip: zet de repository op **Private** als je wilt dat alleen jullie tweeën de link kunnen gebruiken. De pagina zelf bevat geen inlogscherm.

## Maandelijks gebruik

1. Log in bij ING (voor beide rekeningen) en exporteer het afschrift van de afgelopen maand als CSV.
2. Open de website, ga naar **Invoeren**, en upload het CSV-bestand van persoon 1 en persoon 2.
3. Transacties die de site herkent (op basis van winkelnaam) worden automatisch gecategoriseerd. De rest verschijnt onder het tabblad **Categoriseren** — ken daar handmatig een categorie toe. Vink "onthoud dit" aan zodat dezelfde winkel voortaan automatisch herkend wordt.
4. Bekijk **Maandoverzicht** voor de details van deze maand, **Jaaroverzicht** voor het hele jaar, en **Totaaloverzicht** voor alles sinds het begin.

## Data bewaren

Omdat de site geen server heeft, wordt alle data opgeslagen in de browser van het apparaat waarop je hem gebruikt (localStorage). Dat betekent:

- Op hetzelfde apparaat en dezelfde browser blijft alles automatisch bewaard, ook na het sluiten van het tabblad.
- Wil je op een ander apparaat verder, of samen met je partner in dezelfde administratie werken? Gebruik dan **Instellingen → Data beheren → Back-up downloaden**, stuur het `.json`-bestand naar elkaar (bijv. via een gedeelde map), en laad het in via **Back-up inladen**.
- Maak sowieso af en toe een back-up-bestand, zeker voor je browserdata opschoont of van apparaat wisselt — anders ben je de complete geschiedenis kwijt.

## Categorieën en regels aanpassen

Onder **Instellingen** kun je:
- de namen van jullie twee accounts instellen,
- categorieën toevoegen, van kleur wijzigen of verwijderen (een categorie die al bij transacties gebruikt wordt, kan pas verwijderd worden nadat die transacties een andere categorie hebben gekregen),
- herkenningsregels beheren (welke tekst in een omschrijving hoort bij welke categorie),
- een categorie markeren als "telt niet mee in saldo" — handig voor overboekingen tussen jullie eigen rekeningen of overboekingen naar een spaarrekening, zodat die niet als "uitgave" meetellen in het spaarsaldo.

## Schulden (leningen &amp; hypotheek)

Onder het tabblad **Schulden** houd je leningen en de hypotheek bij, per persoon of samen. Voor elke schuld vul je een **peildatum** en het **saldo op die peildatum** in — bijvoorbeeld het bedrag van het laatste jaaroverzicht van DUO of de hypotheekverstrekker. Rente wordt niet automatisch berekend (dat is te onnauwkeurig zonder een volledig aflossingsschema); werk in plaats daarvan het saldo periodiek (bv. jaarlijks) bij met de officiële cijfers.

Aflossingen die wél als aparte transactie op je afschrift staan (categorie "Aflossing schuld") worden automatisch aan de juiste schuld gekoppeld op basis van de tegenrekening, en tellen mee vanaf de peildatum. Net als bij spaarpotjes is dit altijd handmatig te corrigeren, en is er een knop om alles opnieuw automatisch te koppelen.

Voor een hypotheek kun je ook een **WOZ-waarde** invullen; de site berekent dan automatisch de overwaarde (WOZ-waarde min openstaande hypotheekschuld).

## Vaste lasten vs. variabele uitgaven

In het Maand- en Jaaroverzicht zie je een balkje dat uitgaven opsplitst in vaste lasten (bv. woning, verzekeringen, abonnementen) en variabele uitgaven (bv. boodschappen, uit eten). Welke categorieën als "vaste last" gelden, stel je zelf in bij **Instellingen → Categorieën**.

## Abonnementen

Het tabblad **Abonnementen** speurt automatisch naar terugkerende uitgaven: dezelfde omschrijving met een vergelijkbaar bedrag in minstens twee verschillende maanden. Handig om vergeten abonnementen te ontdekken. Dit is een schatting op basis van je transacties, geen aparte administratie — mist de site iets, dan verandert dat vanzelf zodra er meer maanden aan data zijn. Onterecht gevonden abonnementen kun je met het kruisje verbergen.

## Vermogensopbouw

Onder het tabblad **Vermogensopbouw** houd je spaarpotjes bij (bijvoorbeeld "Vakantie" of "Noodfonds"), inclusief van wie elk potje is en wat het startsaldo was. Potjes voeg je zelf handmatig toe.

Transacties in de categorie "Sparen" worden automatisch aan een potje gekoppeld op basis van de tegenrekening (of een stukje tekst uit de omschrijving) — dezelfde spaarrekening wordt zo voortaan herkend. Nog niet gekoppelde transacties verschijnen bovenaan het tabblad; onderaan staat een tabel met **alle** spaartransacties, waar je de koppeling altijd handmatig kunt aanpassen. Er is ook een knop om alles opnieuw automatisch te koppelen op basis van de huidige regels.

Deze spaartransacties tellen niet mee als "uitgave" in het spaarsaldo (het is immers geen geld dat weg is, alleen verplaatst), maar zijn wel gewoon zichtbaar in het **Maandoverzicht**, in een apart overzicht.

## Filteren in het maandoverzicht

Boven de transactietabel in het Maandoverzicht kun je filteren op categorie, zodat je bijvoorbeeld alleen "Boodschappen" van die maand ziet.



- Werkt met het standaard ING CSV-exportformaat (kolommen: Datum, Naam / Omschrijving, Rekening, Tegenrekening, Code, Af Bij, Bedrag (EUR), Mutatiesoort, Mededelingen). Andere banken exporteren met andere kolomnamen; laat het weten als je die ondersteuning ook nodig hebt.
- Er is geen wachtwoord op de pagina zelf — de bescherming zit in het wel of niet delen van de link/repository.

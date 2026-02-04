package com.dorachecker.service;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.properties.TextAlignment;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;

@Service
public class SampleContractService {

    public byte[] generateSamplePdf() {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        try (PdfWriter writer = new PdfWriter(baos);
             PdfDocument pdfDoc = new PdfDocument(writer);
             Document doc = new Document(pdfDoc)) {

            doc.add(new Paragraph("IKT-TEENUSE LEPING")
                    .setFontSize(18).setBold().setTextAlignment(TextAlignment.CENTER));
            doc.add(new Paragraph("Leping nr: IKT-2025/001")
                    .setFontSize(10).setTextAlignment(TextAlignment.CENTER));
            doc.add(new Paragraph("\n"));

            doc.add(new Paragraph("1. LEPINGU POOLED")
                    .setFontSize(14).setBold());
            doc.add(new Paragraph(
                    "Käesolev leping on sõlmitud OÜ Näidis Finants (edaspidi \"Klient\") ja " +
                    "AS Demo Pilveteenused (edaspidi \"Teenusepakkuja\") vahel.\n\n" +
                    "[NB: See on näidisleping testimise eesmärgil. Ettevõtete nimed on fiktiivsed.]"));

            doc.add(new Paragraph("\n2. TEENUSE KIRJELDUS JA KVALITEET")
                    .setFontSize(14).setBold());
            doc.add(new Paragraph(
                    "2.1. Teenusepakkuja kohustub osutama Kliendile pilveinfrastruktuuri teenuseid " +
                    "vastavalt käesoleva lepingu Lisas 1 sätestatud teenuse kirjeldusele.\n\n" +
                    "2.2. Teenustasemed (SLA):\n" +
                    "  a) Teenuse kättesaadavus: vähemalt 99.5% kalendrikuus\n" +
                    "  b) Kriitilistele intsidentidele reageerimise aeg: kuni 30 minutit\n" +
                    "  c) Kriitilistele intsidentidele lahendamise aeg: kuni 4 tundi\n" +
                    "  d) Planeeritud hooldustööde etteteatamine: vähemalt 5 tööpäeva\n\n" +
                    "2.3. Teenustasemete täitmist mõõdetakse ja raporteeritakse igakuiselt."));

            doc.add(new Paragraph("\n3. ANDMETE TÖÖTLEMINE JA ASUKOHT")
                    .setFontSize(14).setBold());
            doc.add(new Paragraph(
                    "3.1. Kõik Kliendi andmed töödeldakse ja hoitakse Euroopa Liidu liikmesriikides.\n\n" +
                    "3.2. Andmete peamine töötlemise asukoht on Saksamaa (Frankfurt) ja " +
                    "varukoopia asukoht on Iirimaa (Dublin).\n\n" +
                    "3.3. Andmete edastamine kolmandatesse riikidesse on keelatud ilma Kliendi " +
                    "eelneva kirjaliku nõusolekuta."));

            doc.add(new Paragraph("\n4. AUDITEERIMISÕIGUS")
                    .setFontSize(14).setBold());
            doc.add(new Paragraph(
                    "4.1. Kliendil ja tema volitatud esindajatel on õigus auditeerida Teenusepakkuja " +
                    "tegevust käesoleva lepingu täitmisel.\n\n" +
                    "4.2. Auditeerimisest tuleb ette teatada vähemalt 30 kalendripäeva.\n\n" +
                    "4.3. Finantsinspektsioonil ja teistel pädevatel järelevalveasutustel on õigus " +
                    "teostada kohapealseid inspektsioone."));

            doc.add(new Paragraph("\n5. INTSIDENTIDEST TEAVITAMINE")
                    .setFontSize(14).setBold());
            doc.add(new Paragraph(
                    "5.1. Teenusepakkuja teavitab Klienti kõigist olulistest turvaintsidentidest " +
                    "mõistliku aja jooksul.\n\n" +
                    "5.2. Teavitus sisaldab intsidendi kirjeldust, mõju hinnangut ja " +
                    "kavandatavaid parandusmeetmeid."));
            // NB: 24h tähtaeg puudub - see on teadlik puudujääk testimiseks

            doc.add(new Paragraph("\n6. TURVAMEETMED")
                    .setFontSize(14).setBold());
            doc.add(new Paragraph(
                    "6.1. Teenusepakkuja rakendab asjakohaseid tehnilisi ja organisatsioonilisi turvameetmeid.\n\n" +
                    "6.2. Andmete krüpteerimine: AES-256 puhkeolekus, TLS 1.3 edastamisel.\n\n" +
                    "6.3. Juurdepääsu kontroll: mitmefaktoriline autentimine kõigile administraatoritele.\n\n" +
                    "6.4. Teenusepakkuja on ISO 27001 sertifitseeritud (sertifikaat nr: ISO-2024-78542)."));

            doc.add(new Paragraph("\n7. ÄRIJÄTKUVUS")
                    .setFontSize(14).setBold());
            doc.add(new Paragraph(
                    "7.1. Teenusepakkujal on ärijätkuvusplaan, mida testitakse vähemalt kord aastas.\n\n" +
                    "7.2. Andmete varundamine toimub iga 24 tunni tagant.\n\n" +
                    "7.3. Taastamise ajaeesmärk (RTO): 4 tundi. Taastamispunkti eesmärk (RPO): 1 tund."));

            // NB: Väljumisstrateegia ja alltöövõtjate klauslid puuduvad teadlikult

            doc.add(new Paragraph("\n8. LEPINGU KEHTIVUS")
                    .setFontSize(14).setBold());
            doc.add(new Paragraph(
                    "8.1. Käesolev leping jõustub allkirjastamise kuupäeval ja kehtib 36 kuud.\n\n" +
                    "8.2. Leping pikeneb automaatselt 12 kuu võrra, kui kumbki pool ei teata " +
                    "ülesütlemisest ette vähemalt 6 kuud."));

            doc.add(new Paragraph("\n\n"));
            doc.add(new Paragraph("Allkirjastatud digitaalselt 15.01.2025")
                    .setFontSize(10).setItalic());

        } catch (Exception e) {
            throw new RuntimeException("Failed to generate sample PDF", e);
        }

        return baos.toByteArray();
    }
}

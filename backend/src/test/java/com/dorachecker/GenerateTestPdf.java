package com.dorachecker;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;

public class GenerateTestPdf {
    public static void main(String[] args) throws Exception {
        String path = args.length > 0 ? args[0] : "test-contract.pdf";
        PdfWriter writer = new PdfWriter(path);
        PdfDocument pdf = new PdfDocument(writer);
        Document doc = new Document(pdf);

        doc.add(new Paragraph("IKT-TEENUSTE LEPING NR 2024-001"));
        doc.add(new Paragraph("Pooled: Swedbank AS (Tellija) ja CloudTech OU (Teenusepakkuja)"));
        doc.add(new Paragraph(""));
        doc.add(new Paragraph("1. TEENUSE KIRJELDUS"));
        doc.add(new Paragraph("Teenusepakkuja osutab Tellijale pilvetaristu teenuseid vastavalt Lisas 1 kirjeldatule. "
            + "Teenus holmab andmete hoiustamist, tootlemist ja varundamist."));
        doc.add(new Paragraph(""));
        doc.add(new Paragraph("2. TEENUSTASEMED (SLA)"));
        doc.add(new Paragraph("Teenuse kattesaadavus: vahemalt 99.5% kalendrikuus. "
            + "Reageerimisaeg kriitilistele intsidentidele: kuni 15 minutit. "
            + "Lahendamisaeg: kuni 4 tundi."));
        doc.add(new Paragraph(""));
        doc.add(new Paragraph("3. INTSIDENTIDEST TEAVITAMINE"));
        doc.add(new Paragraph("Teenusepakkuja teavitab Tellijat koigist IKT intsidentidest 24 tunni jooksul."));
        doc.add(new Paragraph(""));
        doc.add(new Paragraph("4. AUDITEERIMINE"));
        doc.add(new Paragraph("Tellijal on oigus auditeerida Teenusepakkuja tegevust. "
            + "Finantsinspektsioonil on samavaarsed oigused."));
        doc.add(new Paragraph(""));
        doc.add(new Paragraph("5. ANDMEKAITSE"));
        doc.add(new Paragraph("Andmeid tooteldakse Euroopa Liidu territooriumil."));
        doc.add(new Paragraph(""));
        doc.add(new Paragraph("6. KONFIDENTSIAALSUS"));
        doc.add(new Paragraph("Teenusepakkuja hoiab kogu teabe konfidentsiaalsena."));

        doc.close();
        System.out.println("Test PDF generated: " + path);
    }
}

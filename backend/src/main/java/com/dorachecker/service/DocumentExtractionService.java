package com.dorachecker.service;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfReader;
import com.itextpdf.kernel.pdf.canvas.parser.PdfTextExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import org.apache.poi.xwpf.usermodel.XWPFTableRow;
import org.apache.poi.xwpf.usermodel.XWPFTableCell;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;

@Service
public class DocumentExtractionService {

    public String extractText(MultipartFile file) {
        String filename = file.getOriginalFilename();
        if (filename == null) {
            throw new IllegalArgumentException("Faili nimi puudub");
        }

        String lower = filename.toLowerCase();
        if (lower.endsWith(".pdf")) {
            return extractFromPdf(file);
        } else if (lower.endsWith(".docx")) {
            return extractFromDocx(file);
        } else {
            throw new IllegalArgumentException("Toetamata failitüüp. Lubatud: PDF, DOCX");
        }
    }

    private String extractFromPdf(MultipartFile file) {
        try {
            PdfReader reader = new PdfReader(new ByteArrayInputStream(file.getBytes()));
            PdfDocument pdf = new PdfDocument(reader);
            StringBuilder sb = new StringBuilder();
            for (int i = 1; i <= pdf.getNumberOfPages(); i++) {
                String pageText = PdfTextExtractor.getTextFromPage(pdf.getPage(i));
                sb.append(pageText).append("\n");
            }
            pdf.close();
            return sb.toString().trim();
        } catch (IOException e) {
            throw new RuntimeException("PDF teksti eraldamine ebaõnnestus: " + e.getMessage(), e);
        }
    }

    private String extractFromDocx(MultipartFile file) {
        try (XWPFDocument doc = new XWPFDocument(new ByteArrayInputStream(file.getBytes()))) {
            StringBuilder sb = new StringBuilder();

            for (XWPFParagraph para : doc.getParagraphs()) {
                String text = para.getText();
                if (text != null && !text.isBlank()) {
                    sb.append(text).append("\n");
                }
            }

            for (XWPFTable table : doc.getTables()) {
                for (XWPFTableRow row : table.getRows()) {
                    StringBuilder rowText = new StringBuilder();
                    for (XWPFTableCell cell : row.getTableCells()) {
                        if (rowText.length() > 0) rowText.append(" | ");
                        rowText.append(cell.getText());
                    }
                    sb.append(rowText).append("\n");
                }
            }

            return sb.toString().trim();
        } catch (IOException e) {
            throw new RuntimeException("DOCX teksti eraldamine ebaõnnestus: " + e.getMessage(), e);
        }
    }
}

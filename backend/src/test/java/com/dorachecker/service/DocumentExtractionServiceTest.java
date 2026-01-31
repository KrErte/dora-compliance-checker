package com.dorachecker.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.*;

class DocumentExtractionServiceTest {

    private DocumentExtractionService service;

    @BeforeEach
    void setUp() {
        service = new DocumentExtractionService();
    }

    @Test
    void extractText_nullFilename_throwsException() {
        MockMultipartFile file = new MockMultipartFile("file", null,
                "application/octet-stream", "data".getBytes());

        assertThrows(IllegalArgumentException.class, () -> service.extractText(file));
    }

    @Test
    void extractText_unsupportedFormat_throwsException() {
        MockMultipartFile file = new MockMultipartFile("file", "test.txt",
                "text/plain", "data".getBytes());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.extractText(file));
        assertTrue(ex.getMessage().contains("Toetamata failitüüp"));
    }

    @Test
    void extractText_invalidPdf_throwsException() {
        MockMultipartFile file = new MockMultipartFile("file", "test.pdf",
                "application/pdf", "not a real pdf".getBytes());

        assertThrows(RuntimeException.class, () -> service.extractText(file));
    }

    @Test
    void extractText_invalidDocx_throwsException() {
        MockMultipartFile file = new MockMultipartFile("file", "test.docx",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "not a real docx".getBytes());

        assertThrows(RuntimeException.class, () -> service.extractText(file));
    }
}

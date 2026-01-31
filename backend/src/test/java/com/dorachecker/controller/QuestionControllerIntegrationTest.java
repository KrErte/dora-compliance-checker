package com.dorachecker.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class QuestionControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void getAllQuestions_returns200WithQuestions() throws Exception {
        mockMvc.perform(get("/api/questions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(37)))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].questionEt").isNotEmpty())
                .andExpect(jsonPath("$[0].questionEn").isNotEmpty())
                .andExpect(jsonPath("$[0].articleReference").isNotEmpty())
                .andExpect(jsonPath("$[0].category").isNotEmpty());
    }
}

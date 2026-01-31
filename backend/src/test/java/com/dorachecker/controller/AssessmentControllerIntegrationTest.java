package com.dorachecker.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.IntStream;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AssessmentControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void createAssessment_validRequest_returns200() throws Exception {
        Map<String, Object> request = new HashMap<>();
        request.put("companyName", "Test OÜ");
        request.put("contractName", "ICT Leping");
        Map<Integer, Boolean> answers = new HashMap<>();
        IntStream.rangeClosed(1, 37).forEach(i -> answers.put(i, true));
        request.put("answers", answers);

        mockMvc.perform(post("/api/assessments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.companyName").value("Test OÜ"))
                .andExpect(jsonPath("$.complianceLevel").value("GREEN"))
                .andExpect(jsonPath("$.compliantCount").value(37));
    }

    @Test
    void createAssessment_missingCompanyName_returns400() throws Exception {
        Map<String, Object> request = new HashMap<>();
        request.put("companyName", "");
        request.put("contractName", "ICT Leping");
        request.put("answers", Map.of(1, true));

        mockMvc.perform(post("/api/assessments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getAssessment_existingId_returns200() throws Exception {
        // First create an assessment
        Map<String, Object> request = new HashMap<>();
        request.put("companyName", "Test OÜ");
        request.put("contractName", "ICT Leping");
        Map<Integer, Boolean> answers = new HashMap<>();
        IntStream.rangeClosed(1, 37).forEach(i -> answers.put(i, i % 2 == 0));
        request.put("answers", answers);

        MvcResult createResult = mockMvc.perform(post("/api/assessments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        String id = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asText();

        // Then retrieve it
        mockMvc.perform(get("/api/assessments/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.companyName").value("Test OÜ"));
    }

    @Test
    void getAssessment_nonExistingId_returns404() throws Exception {
        mockMvc.perform(get("/api/assessments/non-existing-id"))
                .andExpect(status().isNotFound());
    }
}

package com.dorachecker.controller;

import com.dorachecker.model.DoraQuestion;
import com.dorachecker.service.QuestionService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/questions")
public class QuestionController {

    private final QuestionService questionService;

    public QuestionController(QuestionService questionService) {
        this.questionService = questionService;
    }

    @GetMapping
    public List<DoraQuestion> getAllQuestions() {
        return questionService.getAllQuestions();
    }
}

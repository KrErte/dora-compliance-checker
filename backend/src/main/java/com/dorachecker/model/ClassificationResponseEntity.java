package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "ai_act_classification_responses",
    uniqueConstraints = @UniqueConstraint(columnNames = {"aiSystemId", "questionId"}))
public class ClassificationResponseEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private String id;

  @Column(nullable = false, length = 100)
  private String aiSystemId;

  @Column(nullable = false, length = 100)
  private String questionId;

  @Column(nullable = false, length = 200)
  private String answer;

  @Column(nullable = false, length = 100)
  private String userId;

  private LocalDateTime createdAt;

  public ClassificationResponseEntity() {}

  @PrePersist
  protected void onCreate() {
    createdAt = LocalDateTime.now();
  }

  // Getters and setters
  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getAiSystemId() {
    return aiSystemId;
  }

  public void setAiSystemId(String aiSystemId) {
    this.aiSystemId = aiSystemId;
  }

  public String getQuestionId() {
    return questionId;
  }

  public void setQuestionId(String questionId) {
    this.questionId = questionId;
  }

  public String getAnswer() {
    return answer;
  }

  public void setAnswer(String answer) {
    this.answer = answer;
  }

  public String getUserId() {
    return userId;
  }

  public void setUserId(String userId) {
    this.userId = userId;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }
}

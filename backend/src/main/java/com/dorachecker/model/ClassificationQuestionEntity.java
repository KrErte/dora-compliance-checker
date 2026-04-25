package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_act_classification_questions")
public class ClassificationQuestionEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private String id;

  @Column(nullable = false, unique = true, length = 80)
  private String questionKey;

  @Column(nullable = false, length = 500)
  private String questionTextEn;

  @Column(nullable = false, length = 500)
  private String questionTextEt;

  @Column(nullable = false, length = 20)
  private String questionType = "YES_NO"; // YES_NO, SINGLE_CHOICE, MULTI_CHOICE

  @Column(columnDefinition = "TEXT")
  private String options; // JSON string for choices

  @Column(length = 50)
  private String category;

  @Column(length = 500)
  private String helpTextEn;

  @Column(length = 500)
  private String helpTextEt;

  private int sortOrder;

  @Column(length = 80)
  private String dependsOnKey;

  @Column(length = 20)
  private String dependsOnAnswer;

  @Column(nullable = false)
  private boolean active = true;

  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;

  public ClassificationQuestionEntity() {}

  @PrePersist
  protected void onCreate() {
    createdAt = LocalDateTime.now();
    updatedAt = LocalDateTime.now();
  }

  @PreUpdate
  protected void onUpdate() {
    updatedAt = LocalDateTime.now();
  }

  // Getters and setters
  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getQuestionKey() {
    return questionKey;
  }

  public void setQuestionKey(String questionKey) {
    this.questionKey = questionKey;
  }

  public String getQuestionTextEn() {
    return questionTextEn;
  }

  public void setQuestionTextEn(String questionTextEn) {
    this.questionTextEn = questionTextEn;
  }

  public String getQuestionTextEt() {
    return questionTextEt;
  }

  public void setQuestionTextEt(String questionTextEt) {
    this.questionTextEt = questionTextEt;
  }

  public String getQuestionType() {
    return questionType;
  }

  public void setQuestionType(String questionType) {
    this.questionType = questionType;
  }

  public String getOptions() {
    return options;
  }

  public void setOptions(String options) {
    this.options = options;
  }

  public String getCategory() {
    return category;
  }

  public void setCategory(String category) {
    this.category = category;
  }

  public String getHelpTextEn() {
    return helpTextEn;
  }

  public void setHelpTextEn(String helpTextEn) {
    this.helpTextEn = helpTextEn;
  }

  public String getHelpTextEt() {
    return helpTextEt;
  }

  public void setHelpTextEt(String helpTextEt) {
    this.helpTextEt = helpTextEt;
  }

  public int getSortOrder() {
    return sortOrder;
  }

  public void setSortOrder(int sortOrder) {
    this.sortOrder = sortOrder;
  }

  public String getDependsOnKey() {
    return dependsOnKey;
  }

  public void setDependsOnKey(String dependsOnKey) {
    this.dependsOnKey = dependsOnKey;
  }

  public String getDependsOnAnswer() {
    return dependsOnAnswer;
  }

  public void setDependsOnAnswer(String dependsOnAnswer) {
    this.dependsOnAnswer = dependsOnAnswer;
  }

  public boolean isActive() {
    return active;
  }

  public void setActive(boolean active) {
    this.active = active;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public LocalDateTime getUpdatedAt() {
    return updatedAt;
  }
}

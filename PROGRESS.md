# DORA Compliance Checker - Progress

## Tükk 1: Projekti setup ja Spring Boot backend - VALMIS

### Loodud failid

**Backend struktuur:**
```
backend/
  pom.xml                          (Spring Boot 3.2.1, Java 17, web, validation, jpa, h2, springdoc-openapi)
  Dockerfile                       (multi-stage build with Eclipse Temurin)
  src/main/java/com/dorachecker/
    DoraComplianceCheckerApplication.java
    model/
      DoraQuestion.java            (id, questionEt, questionEn, articleReference, explanation, recommendation, category)
      AssessmentRequest.java       (companyName, contractName, answers Map<Integer,Boolean>)
      AssessmentResult.java        (score, complianceLevel GREEN/YELLOW/RED, questionResults)
      AssessmentEntity.java        (JPA entity for H2 persistence)
      AssessmentRepository.java    (Spring Data JPA repository)
    controller/
      QuestionController.java      (GET /api/questions)
      AssessmentController.java    (POST /api/assessments, GET /api/assessments/{id})
    service/
      QuestionService.java         (15 DORA Article 30 küsimust hardcoded, eesti+inglise keeles)
      AssessmentService.java       (arvutab skoori, määrab compliance level, salvestab H2-sse)
  src/main/resources/
    application.properties         (port 8080, H2 console enabled)
```

### API endpointid
- `GET /api/questions` - Tagastab 15 DORA Article 30 küsimust (eesti + inglise keeles)
- `POST /api/assessments` - Loob uue hindamise, arvutab skoori
- `GET /api/assessments/{id}` - Tagastab hindamise tulemuse ID järgi
- `GET /swagger-ui.html` - OpenAPI/Swagger UI
- `GET /h2-console` - H2 andmebaasi konsool

### Testitud
- Backend kompileerub edukalt (`mvn package`)
- `GET /api/questions` tagastab kõik 15 küsimust korrektselt
- `POST /api/assessments` arvutab skoori ja tagastab tulemuse (testitud: 9/15 = 60% = YELLOW)
- `GET /api/assessments/{id}` tagastab salvestatud hindamise

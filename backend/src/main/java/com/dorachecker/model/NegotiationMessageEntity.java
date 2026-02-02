package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "negotiation_messages")
public class NegotiationMessageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String negotiationItemId;

    @Column(nullable = false)
    private String negotiationId;

    @Column(nullable = false)
    private String messageType;

    @Column(nullable = false)
    private String direction = "OUTBOUND";

    private String subject;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    @Column(nullable = false)
    private String status = "DRAFT";

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public NegotiationMessageEntity() {}

    public NegotiationMessageEntity(String negotiationId, String negotiationItemId,
                                     String messageType, String direction,
                                     String subject, String body) {
        this.negotiationId = negotiationId;
        this.negotiationItemId = negotiationItemId;
        this.messageType = messageType;
        this.direction = direction;
        this.subject = subject;
        this.body = body;
        this.createdAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getNegotiationItemId() { return negotiationItemId; }
    public void setNegotiationItemId(String negotiationItemId) { this.negotiationItemId = negotiationItemId; }
    public String getNegotiationId() { return negotiationId; }
    public void setNegotiationId(String negotiationId) { this.negotiationId = negotiationId; }
    public String getMessageType() { return messageType; }
    public void setMessageType(String messageType) { this.messageType = messageType; }
    public String getDirection() { return direction; }
    public void setDirection(String direction) { this.direction = direction; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

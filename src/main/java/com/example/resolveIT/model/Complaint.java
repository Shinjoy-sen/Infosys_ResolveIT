
package com.example.resolveIT.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

@Entity
public class Complaint {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String email;
    private String category;
    private String subcategory;
    private String location;
    private LocalDate dateOfIncident;

    @Column(length = 4000)
    private String description;

    private String urgency;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;

    private Boolean markEscalated = false;
    private String escalationNote;

    private String submittedBy;

    @Column(length = 2000)
    private String attachments;

    //added later
    @Enumerated(EnumType.STRING)
    private ComplaintStatus status = ComplaintStatus.PENDING;

    @Column(name = "assigned_officer_id")
    private Long assignedOfficerId;

    @Column(columnDefinition = "TEXT")
    private String solutionNote;


    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getSubcategory() { return subcategory; }
    public void setSubcategory(String subcategory) { this.subcategory = subcategory; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public LocalDate getDateOfIncident() { return dateOfIncident; }
    public void setDateOfIncident(LocalDate dateOfIncident) { this.dateOfIncident = dateOfIncident; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getUrgency() { return urgency; }
    public void setUrgency(String urgency) { this.urgency = urgency; }
    public String getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(String submittedBy) { this.submittedBy = submittedBy; }
    public String getAttachments() { return attachments; }
    public void setAttachments(String attachments) { this.attachments = attachments; }
    public LocalDateTime getCreatedAt() {return createdAt ;}
    public void setCreatedAt(LocalDateTime createdAt) {this.createdAt=createdAt;}
    public LocalDateTime getResolvedAt() {return resolvedAt ;}
    public void setResolvedAt(LocalDateTime resolvedAt) {this.resolvedAt=resolvedAt;}
    public String getEscalationNote() { return escalationNote; }
    public void setEscalationNote(String escalationNote) { this.escalationNote = escalationNote; }
    public Boolean getMarkEscalated() { return markEscalated; }
    public void setMarkEscalated(Boolean markEscalated) { this.markEscalated = markEscalated; }

    public ComplaintStatus getStatus() {
        return status;
    }
    public void setStatus(ComplaintStatus status) {
        this.status = status;
    }
    public Long getAssignedOfficerId() {
        return assignedOfficerId;
    }
    public void setAssignedOfficerId(Long assignedOfficerId) {
        this.assignedOfficerId = assignedOfficerId;
    }
    public String getSolutionNote() {
        return solutionNote;
    }
    public void setSolutionNote(String solutionNote) {
        this.solutionNote = solutionNote;
    }
}

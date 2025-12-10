package com.example.resolveIT.controller;

import com.example.resolveIT.model.Complaint;
import com.example.resolveIT.repo.ComplaintRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/escalation")   // <<--- matches frontend "/api/admin/escalation"
@CrossOrigin
@PreAuthorize("hasRole('ADMIN')")
public class AdminEscalationController {

    private final ComplaintRepository complaintRepo;

    public AdminEscalationController(ComplaintRepository complaintRepo) {
        this.complaintRepo = complaintRepo;
    }

    @PostMapping("/escalate/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Complaint escalateComplaint(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        String note = body.getOrDefault("note", "No message provided");
        Complaint c = complaintRepo.findById(id).orElseThrow();

        c.setMarkEscalated(true);          // store escalation flag
        c.setEscalationNote(note);         // store admin warning message

        return complaintRepo.save(c);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<Complaint> getEscalatedComplaints() {
        return complaintRepo.findByMarkEscalatedTrue();
    }


}

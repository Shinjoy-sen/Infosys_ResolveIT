package com.example.resolveIT.controller;

import com.example.resolveIT.model.Complaint;
import com.example.resolveIT.model.ComplaintStatus;
import com.example.resolveIT.model.User;
import com.example.resolveIT.repo.ComplaintRepository;
import com.example.resolveIT.repo.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/officer")
@CrossOrigin(origins = "http://localhost:8090")
public class OfficerController {

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private ComplaintRepository complaintRepo;

    // 1️⃣ OFFICER: Get assigned complaints
    @GetMapping("/assigned")
    public List<Complaint> getAssignedComplaints(Authentication auth) {
        String username = auth.getName();

        User officer = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Officer not found"));

        return complaintRepo.findByAssignedOfficerId(officer.getId());
    }

    // 2️⃣ OFFICER: Update complaint status & solution note
    @PostMapping("/update-status")
    public ResponseEntity<?> updateStatus(
            @RequestBody Map<String, String> body,
            Authentication auth)         
    {
        Long complaintId = Long.parseLong(body.get("complaintId"));
        String newStatus = body.get("status");
        String solutionNote = body.getOrDefault("solutionNote", "");

        Complaint c = complaintRepo.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        c.setStatus(ComplaintStatus.valueOf(newStatus));

        if (!solutionNote.isBlank()) {
            c.setSolutionNote(solutionNote);
        }
        //change resolve date-time
        if (newStatus.equals("RESOLVED")) {
            c.setResolvedAt(LocalDateTime.now());
        }

        complaintRepo.save(c);

        return ResponseEntity.ok("Status updated successfully");
    }
}

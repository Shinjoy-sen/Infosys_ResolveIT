
package com.example.resolveIT.service;

import com.example.resolveIT.model.*;
import com.example.resolveIT.repo.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;

@Service
public class ComplaintService {
    private final ComplaintRepository complaintRepo;
    private final ComplaintFileRepository fileRepo;
    private final StorageService storageService;

    public ComplaintService(ComplaintRepository cr, ComplaintFileRepository fr, StorageService ss) {
        this.complaintRepo = cr;
        this.fileRepo = fr;
        this.storageService = ss;
    }

    public Complaint createComplaint(Complaint c, MultipartFile[] files) throws IOException {
        Complaint saved = complaintRepo.save(c);
        if (files != null) {
            for (MultipartFile f : files) {
                if (f.isEmpty()) continue;
                String fname = f.getOriginalFilename() != null ? f.getOriginalFilename().toLowerCase() : "";
                if (!(fname.endsWith(".jpg")||fname.endsWith(".jpeg")||fname.endsWith(".png")||fname.endsWith(".pdf")||fname.endsWith(".mp4"))) continue;
                String path = storageService.store(f);
                ComplaintFile cf = new ComplaintFile();
                cf.setComplaint(saved);
                cf.setFilename(f.getOriginalFilename());
                cf.setStoredPath(path);
                cf.setContentType(f.getContentType());
                fileRepo.save(cf);
            }
        }
        return saved;
    }

    public List<Complaint> listAll() { return complaintRepo.findAll(); }
    public List<Complaint> listBySubmittedBy(String subject) { return complaintRepo.findBySubmittedBy(subject); }
}


package com.example.resolveIT.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.*;

@Service
public class StorageService {

    @Value("${file.upload-dir}")
    private String uploadDir;

    public String store(MultipartFile file) throws IOException {
        Path path = Paths.get(uploadDir);
        if (!Files.exists(path)) Files.createDirectories(path);
        String clean = System.currentTimeMillis() + "_" + file.getOriginalFilename().replaceAll("[^a-zA-Z0-9._-]", "_");
        Path dest = path.resolve(clean);
        Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);
        return dest.toString();
    }
}

package com.arias.online_store.controller;

import com.arias.online_store.dto.CategoryDTO;
import com.arias.online_store.entity.Category;
import com.arias.online_store.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/categories")
public class CategoryController {

    private final CategoryService categoryService;

    @Autowired
    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Category> getCategoryById(@PathVariable Integer id) {
        Optional<Category> category = categoryService.getCategoryById(id);
        return category.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/without")
    public ResponseEntity<List<CategoryDTO>> getCategoriesWithoutProducts() {
        List<CategoryDTO> categories = categoryService.getAllCategoriesWithoutProducts();
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/full")
    public ResponseEntity<List<Category>> getAllCategoriesWithProducts() {
        List<Category> categories = categoryService.getAllCategoriesWithProducts();
        return ResponseEntity.ok(categories);
    }
}

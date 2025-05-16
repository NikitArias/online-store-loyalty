package com.arias.online_store.service;

import com.arias.online_store.dto.CategoryDTO;
import com.arias.online_store.entity.Category;
import com.arias.online_store.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Autowired
    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public Category saveCategory(Category category) {
        if (category.getName() == null || category.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Введите название категории");
        }

        if (categoryRepository.existsByName(category.getName())) {
            throw new IllegalStateException("Такая категория уже есть");
        }
        return categoryRepository.save(category);
    }

    public Optional<Category> getCategoryById(Integer id) {
        return categoryRepository.findById(id);
    }

    public List<CategoryDTO> getAllCategoriesWithoutProducts() {
        List<Category> categories = categoryRepository.findAll();
        return categories.stream().map(CategoryDTO::new).collect(Collectors.toList());
    }

    public List<Category> getAllCategoriesWithProducts() {
        return categoryRepository.findAll();
    }

    public Optional<Category> updateCategory(Integer id, Category newCategory) {
        return categoryRepository.findById(id).map(category -> {
            category.setName(newCategory.getName());
            return categoryRepository.save(category);
        });
    }

    public boolean deleteCategory(Integer id) {
        if (categoryRepository.existsById(id)) {
            categoryRepository.deleteById(id);
            return true;
        }
        return false;
    }
}

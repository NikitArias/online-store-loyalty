package com.arias.online_store.controller;

import com.arias.online_store.dto.ProductDTO;
import com.arias.online_store.entity.Product;
import com.arias.online_store.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/products")
public class ProductController {

    private final ProductService productService;

    @Autowired
    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping("user/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Integer id) {
        Optional<Product> product = productService.getProductById(id);
        return product.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("user/category/{id}")
    public ResponseEntity<List<Product>> getProductsByCategory(@PathVariable Integer id) {
        List<Product> products = productService.getProductsByCategory(id);
        return ResponseEntity.ok(products);
    }

    @GetMapping("/user")
    public ResponseEntity<List<ProductDTO>> getAllProducts() {
        List<ProductDTO> products = productService.getAllProducts();
        return ResponseEntity.ok(products);
    }
}

package com.arias.online_store.service;

import com.arias.online_store.dto.ProductDTO;
import com.arias.online_store.dto.ProductRequest;
import com.arias.online_store.entity.Category;
import com.arias.online_store.entity.Product;
import com.arias.online_store.repository.OrderRepository;
import com.arias.online_store.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryService categoryService;
    private final OrderRepository orderRepository;

    @Autowired
    public ProductService(ProductRepository productRepository, CategoryService categoryService, OrderRepository orderRepository) {
        this.productRepository = productRepository;
        this.categoryService = categoryService;
        this.orderRepository = orderRepository;
    }

    public Product saveProduct(Product product) {
        return productRepository.save(product);
    }

    public Optional<Product> getProductById(Integer id) {
        return productRepository.findById(id);
    }

    public List<Product> getProductsByCategory(Integer categoryId) {
        return productRepository.findByCategoryId(categoryId);
    }

    public List<ProductDTO> getAllProducts() {
        return productRepository.findAll()
                .stream()
                .map(ProductDTO::new)
                .collect(Collectors.toList());
    }

    public Optional<Product> updateProduct(Integer id, ProductRequest productRequest) {
        Optional<Product> productOpt = productRepository.findById(id);
        if (productOpt.isEmpty()) {
            return Optional.empty();
        }

        Product product = productOpt.get();
        product.setName(productRequest.getName());
        product.setDescription(productRequest.getDescription());
        product.setPrice(productRequest.getPrice());
        product.setStockQuantity(productRequest.getStockQuantity());
        product.setImage(productRequest.getImage());

        if (productRequest.getCategoryId() != null) {
            Optional<Category> categoryOpt = categoryService.getCategoryById(productRequest.getCategoryId());
            categoryOpt.ifPresent(product::setCategory);
        }

        return Optional.of(productRepository.save(product));
    }

    public boolean deleteProduct(Integer id) {
        if (!productRepository.existsById(id)) {
            return false;
        }

        if (orderRepository.existsByOrderItems_Product_Id(id)) {
            throw new IllegalStateException("Нельзя удалить товар, так как он есть в заказе");
        }

        productRepository.deleteById(id);
        return true;
    }
}

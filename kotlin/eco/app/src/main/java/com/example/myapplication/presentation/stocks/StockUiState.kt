package com.example.myapplication.presentation.stocks

import com.example.myapplication.domain.model.Stock

data class StockUiState(
    val stocks: List<Stock> = emptyList(),
    val isLoading: Boolean = false,
    val searchQuery: String = "",
    val errorMessage: String? = null,
    val showAddSheet: Boolean = false
)

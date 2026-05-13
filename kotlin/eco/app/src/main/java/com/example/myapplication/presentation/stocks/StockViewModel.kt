package com.example.myapplication.presentation.stocks

import androidx.lifecycle.ViewModel
import com.example.myapplication.domain.model.MarketType
import com.example.myapplication.domain.model.Stock
import com.example.myapplication.domain.usecase.AddStockUseCase
import com.example.myapplication.domain.usecase.DeleteStockUseCase
import com.example.myapplication.domain.usecase.ObserveStocksUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import io.reactivex.rxjava3.android.schedulers.AndroidSchedulers
import io.reactivex.rxjava3.disposables.CompositeDisposable
import io.reactivex.rxjava3.schedulers.Schedulers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import javax.inject.Inject

@HiltViewModel
class StockViewModel @Inject constructor(
    private val observeStocksUseCase: ObserveStocksUseCase,
    private val addStockUseCase: AddStockUseCase,
    private val deleteStockUseCase: DeleteStockUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(StockUiState())
    val uiState = _uiState.asStateFlow()

    private val disposables = CompositeDisposable()

    init {
        observeStocks()
    }

    private fun observeStocks() {
        val disposable = observeStocksUseCase()
            .subscribeOn(Schedulers.io())
            .observeOn(AndroidSchedulers.mainThread())
            .subscribe(
                { stocks -> _uiState.update { it.copy(stocks = stocks, isLoading = false) } },
                { error -> _uiState.update { it.copy(errorMessage = error.message, isLoading = false) } }
            )
        disposables.add(disposable)
    }

    fun onSearchQueryChange(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
    }

    fun onShowAddSheet() {
        _uiState.update { it.copy(showAddSheet = true) }
    }

    fun onDismissAddSheet() {
        _uiState.update { it.copy(showAddSheet = false) }
    }

    fun addStock(name: String, marketType: MarketType, ticker: String) {
        val stock = Stock(name = name, marketType = marketType, ticker = ticker)
        val disposable = addStockUseCase(stock)
            .subscribeOn(Schedulers.io())
            .observeOn(AndroidSchedulers.mainThread())
            .subscribe(
                { _uiState.update { it.copy(showAddSheet = false) } },
                { error -> _uiState.update { it.copy(errorMessage = error.message) } }
            )
        disposables.add(disposable)
    }

    fun deleteStock(id: Long) {
        val disposable = deleteStockUseCase(id)
            .subscribeOn(Schedulers.io())
            .observeOn(AndroidSchedulers.mainThread())
            .subscribe(
                {},
                { error -> _uiState.update { it.copy(errorMessage = error.message) } }
            )
        disposables.add(disposable)
    }

    fun onErrorDismissed() {
        _uiState.update { it.copy(errorMessage = null) }
    }

    override fun onCleared() {
        disposables.clear()
        super.onCleared()
    }
}

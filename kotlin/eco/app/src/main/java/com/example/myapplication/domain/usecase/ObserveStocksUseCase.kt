package com.example.myapplication.domain.usecase

import com.example.myapplication.domain.model.Stock
import com.example.myapplication.domain.repository.StockRepository
import io.reactivex.rxjava3.core.Observable
import javax.inject.Inject

class ObserveStocksUseCase @Inject constructor(
    private val repository: StockRepository
) {
    operator fun invoke(): Observable<List<Stock>> = repository.observeStocks()
}

package com.example.myapplication.domain.usecase

import com.example.myapplication.domain.model.Stock
import com.example.myapplication.domain.repository.StockRepository
import io.reactivex.rxjava3.core.Completable
import javax.inject.Inject

class AddStockUseCase @Inject constructor(
    private val repository: StockRepository
) {
    operator fun invoke(stock: Stock): Completable {
        require(stock.name.isNotBlank()) { "종목명을 입력해주세요" }
        require(stock.ticker.isNotBlank()) { "Ticker를 입력해주세요" }
        return repository.addStock(stock)
    }
}

package com.example.myapplication.domain.usecase

import com.example.myapplication.domain.repository.StockRepository
import io.reactivex.rxjava3.core.Completable
import javax.inject.Inject

class DeleteStockUseCase @Inject constructor(
    private val repository: StockRepository
) {
    operator fun invoke(id: Long): Completable = repository.deleteStock(id)
}

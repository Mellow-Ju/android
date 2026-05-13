package com.example.myapplication.data.repository

import com.example.myapplication.data.local.dao.StockDao
import com.example.myapplication.data.local.entity.StockEntity
import com.example.myapplication.domain.model.MarketType
import com.example.myapplication.domain.model.Stock
import com.example.myapplication.domain.repository.StockRepository
import io.reactivex.rxjava3.core.Completable
import io.reactivex.rxjava3.core.Observable
import javax.inject.Inject

class StockRepositoryImpl @Inject constructor(
    private val dao: StockDao
) : StockRepository {

    override fun observeStocks(): Observable<List<Stock>> =
        dao.observeAll().map { entities -> entities.map { it.toDomain() } }

    override fun searchStocks(query: String): Observable<List<Stock>> =
        dao.search(query).map { entities -> entities.map { it.toDomain() } }

    override fun addStock(stock: Stock): Completable =
        dao.insert(stock.toEntity())

    override fun deleteStock(id: Long): Completable =
        dao.deleteById(id)

    private fun StockEntity.toDomain() = Stock(
        id = id,
        name = name,
        marketType = MarketType.from(marketType),
        ticker = ticker
    )

    private fun Stock.toEntity() = StockEntity(
        id = id,
        name = name,
        marketType = marketType.label,
        ticker = ticker
    )
}

"""
WealthWise AI — Investment Product Repository

Repository for accessing PostgreSQL master product catalog entries.
"""

from typing import Optional, Sequence
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.investment_product import InvestmentProduct
from app.repositories.base_repository import BaseRepository


class InvestmentProductRepository(BaseRepository[InvestmentProduct]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(InvestmentProduct, db)

    async def get_by_id_str(self, product_id: str) -> Optional[InvestmentProduct]:
        """Fetch product by string ID slug."""
        stmt = select(InvestmentProduct).where(InvestmentProduct.id == product_id)
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def get_all_catalog_products(self) -> Sequence[InvestmentProduct]:
        """Fetch all catalog products from DB."""
        stmt = select(InvestmentProduct).order_by(InvestmentProduct.name)
        res = await self.db.execute(stmt)
        return res.scalars().all()

    async def get_by_category(self, category: str) -> Sequence[InvestmentProduct]:
        """Fetch products by category."""
        stmt = select(InvestmentProduct).where(InvestmentProduct.category == category)
        res = await self.db.execute(stmt)
        return res.scalars().all()

    @staticmethod
    def validate_static_metadata(mdata: dict) -> None:
        """Enforces range validation bounds on static metadata prior to DB insertion."""
        exp = mdata.get("expense_ratio")
        if exp is not None and not (0.0 <= float(exp) <= 5.0):
            raise ValueError(f"Invalid expense_ratio {exp} for {mdata.get('product_id')}: must be 0-5%")

        rating = mdata.get("rating")
        if rating is not None and not (0.0 <= float(rating) <= 5.0):
            raise ValueError(f"Invalid rating {rating} for {mdata.get('product_id')}: must be 0-5")

        ret1 = mdata.get("expected_return_1y")
        if ret1 is not None and not (0.0 <= float(ret1) <= 50.0):
            raise ValueError(f"Invalid expected_return_1y {ret1} for {mdata.get('product_id')}: must be 0-50%")

        ret3 = mdata.get("expected_return_3y")
        if ret3 is not None and not (0.0 <= float(ret3) <= 50.0):
            raise ValueError(f"Invalid expected_return_3y {ret3} for {mdata.get('product_id')}: must be 0-50%")

        aum = mdata.get("aum_cr")
        if aum is not None and float(aum) <= 0.0:
            raise ValueError(f"Invalid aum_cr {aum} for {mdata.get('product_id')}: must be > 0")

    async def seed_from_list(self, products_data: list[dict], static_meta_data: Optional[list[dict]] = None) -> int:
        """
        Seed DB with product catalog entries and static investment metadata.
        Returns count of inserted products.
        """
        existing_count = await self.count()
        if existing_count > 0:
            # Upsert/update static metadata for existing entries if provided
            if static_meta_data:
                meta_map = {m["product_id"]: m for m in static_meta_data}
                existing_products = await self.get_all_catalog_products()
                for prod in existing_products:
                    if prod.id in meta_map:
                        mdict = meta_map[prod.id]
                        self.validate_static_metadata(mdict)
                        prod.expected_return_1y = mdict.get("expected_return_1y")
                        prod.expected_return_3y = mdict.get("expected_return_3y")
                        prod.expense_ratio = mdict.get("expense_ratio")
                        prod.aum_cr = mdict.get("aum_cr")
                        prod.rating = mdict.get("rating")
                        prod.exit_load = mdict.get("exit_load")
                        prod.riskometer = mdict.get("riskometer")
                        prod.category_avg_return = mdict.get("category_avg_return")
                        prod.tracking_error = mdict.get("tracking_error")
                        prod.underlying_index = mdict.get("underlying_index")
                        prod.metadata_version = mdict.get("metadata_version", 1)
                        prod.last_reviewed = mdict.get("last_reviewed")
                        prod.source = mdict.get("source")
                await self.db.flush()
            return 0

        meta_map = {m["product_id"]: m for m in (static_meta_data or [])}
        inserted = 0
        for pdata in products_data:
            merged_dict = dict(pdata)
            pid = merged_dict.get("id")
            if pid in meta_map:
                mdict = meta_map[pid]
                self.validate_static_metadata(mdict)
                merged_dict.update({
                    "expected_return_1y": mdict.get("expected_return_1y"),
                    "expected_return_3y": mdict.get("expected_return_3y"),
                    "expense_ratio": mdict.get("expense_ratio"),
                    "aum_cr": mdict.get("aum_cr"),
                    "rating": mdict.get("rating"),
                    "exit_load": mdict.get("exit_load"),
                    "riskometer": mdict.get("riskometer"),
                    "category_avg_return": mdict.get("category_avg_return"),
                    "tracking_error": mdict.get("tracking_error"),
                    "underlying_index": mdict.get("underlying_index"),
                    "metadata_version": mdict.get("metadata_version", 1),
                    "last_reviewed": mdict.get("last_reviewed"),
                    "source": mdict.get("source"),
                })

            item = InvestmentProduct.from_dict(merged_dict)
            self.db.add(item)
            inserted += 1
        await self.db.flush()
        return inserted


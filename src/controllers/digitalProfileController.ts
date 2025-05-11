import { Request, Response, NextFunction } from "express";
import { getRepository, In, Raw } from "typeorm";
import { AppDataSource } from "../config/database";
import { DigitalProfileHouse } from "../entities/digital_profile/DigitalProfileHouse";
import { DigitalProfileAgriculturecashcrop } from "../entities/digital_profile/DigitalProfileAgriculturecashcrop";
import { DigitalProfileAgricultureflowers } from "../entities/digital_profile/DigitalProfileAgricultureflowers";
import { DigitalProfileAgriculturefoodcrop } from "../entities/digital_profile/DigitalProfileAgriculturefoodcrop";
import { DigitalProfileAgriculturefruits } from "../entities/digital_profile/DigitalProfileAgriculturefruits";
import { DigitalProfileAgricultureoilseeds } from "../entities/digital_profile/DigitalProfileAgricultureoilseeds";
import { DigitalProfileAgriculturepulses } from "../entities/digital_profile/DigitalProfileAgriculturepulses";
import { DigitalProfileAgriculturevegetable } from "../entities/digital_profile/DigitalProfileAgriculturevegetable";
import { DigitalProfileEducation } from "../entities/digital_profile/DigitalProfileEducation";
import { DigitalProfileHealthtreatment } from "../entities/digital_profile/DigitalProfileHealthtreatment";
import { DigitalProfileSchool } from "../entities/digital_profile/DigitalProfileSchool";
import { DigitalProfileToilet } from "../entities/digital_profile/DigitalProfileToilet";
import { DigitalProfileFamilymember } from "../entities/digital_profile/DigitalProfileFamilymember";
import { DigitalProfileLand } from "../entities/digital_profile/DigitalProfileLand";
import { DigitalProfileLoan } from "../entities/digital_profile/DigitalProfileLoan";
import { DigitalProfileSaving } from "../entities/digital_profile/DigitalProfileSaving";
import { Ward } from "../entities/basic/Ward";
import { DigitalProfileHealthstatus } from "../entities/digital_profile/DigitalProfileHealthstatus";
import { DigitalProfileDrinkingwatersurvey } from "../entities/digital_profile/DigitalProfileDrinkingwatersurvey";
import { DigitalProfileCurrentlivingstatus } from "../entities/digital_profile/DigitalProfileCurrentlivingstatus";
import { DigitalProfileDisabilitystatus } from "../entities/digital_profile/DigitalProfileDisabilitystatus";
import { Op } from "sequelize";
import {
  FAMILY_SIZE_MAPPING,
  CASTE_MAPPING,
  LANGUAGE_MAPPING,
  GENDER_MAPPING,
  MARITAL_STATUS_MAPPING,
  OCCUPATION_MAPPING,
  RELIGION_MAPPING,
  DISABILITY_MAPPING,
  BLOOD_GROUP_MAPPING,
  HEALTH_STATUS_MAPPING,
  DISEASE_MAPPING,
  LITERACY_RATE_MAPPING,
  EDUCATION_LEVEL_MAPPING,
  SCHOOL_DROPOUT_MAPPING,
  DROPOUT_REASON_MAPPING,
  FOREIGN_EMPLOYMENT_MAPPING,
  FOREIGN_WORK_MAPPING,
  VEGETABLE_MAPPING,
  PULSE_MAPPING,
  OILSEED_MAPPING,
  FRUIT_MAPPING,
  CASH_CROP_MAPPING,
  DRINKING_WATER_MAPPING,
  TOILET_MAPPING,
  FAMILY_DEATH_MAPPING,
} from "../util/mapping";
import { DigitalProfileCookingfuel } from "../entities/digital_profile/DigitalProfileCookingfuel";
import { DigitalProfileBuildingdetail } from "../entities/digital_profile/DigitalProfileBuildingdetail";
import HttpError from "../util/httpError";
const filterValidBooleans = (arr: any) => {
  return arr?.filter((value: any) => value === 1 || value === 0);
};
class DigitalProfileController {
  constructor(
    private wardRepo = AppDataSource.getRepository(Ward),
    private digitalProfileRepo = AppDataSource.getRepository(
      DigitalProfileHouse
    ),
    private digitalProfileAgriculturecashcropRepo = AppDataSource.getRepository(
      DigitalProfileAgriculturecashcrop
    ),
    private digitalProfileAgricultureflowersRepo = AppDataSource.getRepository(
      DigitalProfileAgricultureflowers
    ),
    private digitalProfileAgriculturefoodcropRepo = AppDataSource.getRepository(
      DigitalProfileAgriculturefoodcrop
    ),
    private digitalProfileAgriculturefruitsRepo = AppDataSource.getRepository(
      DigitalProfileAgriculturefruits
    ),
    private digitalProfileAgricultureoilseedsRepo = AppDataSource.getRepository(
      DigitalProfileAgricultureoilseeds
    ),
    private digitalProfileAgriculturepulsesRepo = AppDataSource.getRepository(
      DigitalProfileAgriculturepulses
    ),
    private digitalProfileAgriculturevegetableRepo = AppDataSource.getRepository(
      DigitalProfileAgriculturevegetable
    ),
    private digitalProfileEducationRepo = AppDataSource.getRepository(
      DigitalProfileEducation
    ),
    private digitalProfileHealthtreatmentRepo = AppDataSource.getRepository(
      DigitalProfileHealthtreatment
    ),
    private digitalProfileSchoolRepo = AppDataSource.getRepository(
      DigitalProfileSchool
    ),
    private digitalProfileToiletRepo = AppDataSource.getRepository(
      DigitalProfileToilet
    ),
    private digitalProfileFamilymemberRepo = AppDataSource.getRepository(
      DigitalProfileFamilymember
    ),
    private digitalProfileLandRepo = AppDataSource.getRepository(
      DigitalProfileLand
    ),
    private digitalProfileLoanRepo = AppDataSource.getRepository(
      DigitalProfileLoan
    ),
    private digitalProfileSavingRepo = AppDataSource.getRepository(
      DigitalProfileSaving
    ),
    private digitalProfileHealthStatusRepo = AppDataSource.getRepository(
      DigitalProfileHealthstatus
    ),
    private digitalProfileWaterSurveyRepo = AppDataSource.getRepository(
      DigitalProfileDrinkingwatersurvey
    ),
    private digitalProfileCurrentLivingStatusRepo = AppDataSource.getRepository(
      DigitalProfileCurrentlivingstatus
    ),
    private digitalProfileDisabiltiyStatusRepo = AppDataSource.getRepository(
      DigitalProfileDisabilitystatus
    ),
    private digitalProfileCookingFuelRepo = AppDataSource.getRepository(
      DigitalProfileCookingfuel
    ),
    private digitalProfileBuildingRepo = AppDataSource.getRepository(
      DigitalProfileBuildingdetail
    )
  ) {}

  private formatNumber(num: number): string {
    return num.toLocaleString();
  }
  async getHouses(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      // Extract pagination, search, and ward_no parameters
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 30;
      const search = req.query.search as string;
      const wardNo = req.query.wardNo as string;
      const ownerEng = req.query.ownerEng as string;
      const ownerNepali = req.query.ownerNepali as string;
      const googlePlusCode = req.query.googlePlusCode as string;

      // Build search conditions if search query is provided
      const searchConditions = search
        ? [
            {
              ownerEng: Raw((alias) => `${alias} ILIKE :value`, {
                value: `%${search}%`,
              }),
            },
            {
              ownerNepali: Raw((alias) => `${alias} ILIKE :value`, {
                value: `%${search}%`,
              }),
            },
          ]
        : undefined;

      // Build specific query filters for owner_eng, owner_nepali, and ward_no
      const queryConditions: any = {
        ...(ownerEng && {
          ownerEng: Raw((alias) => `${alias} ILIKE :ownerEng`, {
            ownerEng: `%${ownerEng}`,
          }),
        }),
        ...(ownerNepali && {
          ownerNepali: Raw((alias) => `${alias} ILIKE :ownerNepali`, {
            ownerNepali: `%${ownerNepali}`,
          }),
        }),
        ...(wardNo && { wardNo: parseInt(wardNo) }),
        ...(googlePlusCode && {
          googlePlusCode: Raw((alias) => `${alias} ILIKE :googlePlusCode`, {
            googlePlusCode: `%${googlePlusCode}`,
          }),
        }),
      };

      // Find houses with pagination, search conditions, and query filters
      const [houses, totalItems] = await this.digitalProfileRepo.findAndCount({
        where: searchConditions
          ? [
              { ...queryConditions, ...searchConditions[0] },
              { ...queryConditions, ...searchConditions[1] },
            ]
          : queryConditions,
        order: {
          createdAt: "DESC", // Sort by createdAt in descending order
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

      // Calculate pagination details
      const totalPages = Math.ceil(totalItems / pageSize);
      const hasPreviousPage = page > 1;
      const hasNextPage = page < totalPages;

      return res.status(200).json({
        status: 200,
        success: true,
        message: "Houses' data retrieved successfully.",
        data: houses,
        pagination: {
          currentPage: page,
          totalPages,
          pageSize,
          totalItems,
          hasPreviousPage,
          hasNextPage,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  //Get House detail by Id
  async getHouseData(req: Request, res: Response, next: NextFunction) {
    const houseId = parseInt(req.params.houseId);
    try {
      const houseData = await this.digitalProfileRepo.findOne({
        where: { houseId },
        relations: [
          "digitalProfileFamilymembers",
          "digitalProfileFamilymembers.digitalProfileCitizenshipdetails",
          "digitalProfileFamilymembers.digitalProfileCurrentlivingstatuses",
          "digitalProfileFamilymembers.digitalProfileDisabilitystatuses",
          "digitalProfileFamilymembers.digitalProfileEpidemicdetails",
          "digitalProfileFamilymembers.digitalProfileHealthstatuses",
          "digitalProfileFamilymembers.digitalProfileNationalidentities",
          "digitalProfileFamilymembers.digitalProfilePandetails",
          "digitalProfileFamilymembers.digitalProfilePassportdetails",
          "digitalProfileFamilymembers.digitalProfileSocialsecurities",
          "digitalProfileFamilymembers.digitalProfileVoterdetails",
          "digitalProfileFamilymembers.digitalProfileEducation",
          "digitalProfileToilets",
          "digitalProfileDrinkingwatersurveys",
          "digitalProfileLightingsources",
          "digitalProfileLoans",
          "digitalProfileExpenses",
          "digitalProfileSavings",
          "digitalProfileAgriculturevegetables",
          "digitalProfileAgriculturepulses",
          "digitalProfileAgriculturecashcrops",
          "digitalProfileAgricultureflowers",
          "digitalProfileAgriculturefoodcrops",
          "digitalProfileAgriculturefruits",
          "digitalProfileAgricultureoilseeds",
        ],
      });

      if (!houseData) {
        return res.status(404).json({
          status: 404,
          success: false,
          message: "House data not found",
          error: null,
          data: null,
        });
      }

      const familyMembers = houseData.digitalProfileFamilymembers.map(
        (member) => ({
          person_id: member.personId,
          created_at: member.createdAt,
          updated_at: member.updatedAt,
          first_name: member.firstName,
          last_name: member.lastName,
          full_name_nepali: member.fullNameNepali,
          full_name_eng: member.fullNameEng,
          gender: member.gender,
          relation_with_family_head: member.relationWithFamilyHead,
          dob: member.dob,
          age: member.age,
          email: member.email,
          mobile_no: member.mobileNo,
          blood_group: member.bloodGroup,
          caste: member.caste,
          religion: member.religion,
          language: member.language,
          occupation: member.occupation,
          marital_status: member.maritalStatus,
          skill: member.skill,
          interest_areas: member.interestAreas,
          house: houseId,
          citizenship_details: member.digitalProfileCitizenshipdetails,
          current_living_status: member.digitalProfileCurrentlivingstatuses,
          disability_status: member.digitalProfileDisabilitystatuses,
          epidemic_details: member.digitalProfileEpidemicdetails,
          health_status: member.digitalProfileHealthstatuses,
          national_identities: member.digitalProfileNationalidentities,
          pan_details: member.digitalProfilePandetails,
          passport_details: member.digitalProfilePassportdetails,
          social_security: member.digitalProfileSocialsecurities,
          voter_details: member.digitalProfileVoterdetails,
          education_details: member.digitalProfileEducation,
        })
      );

      const response = {
        status: 200,
        success: true,
        message: "House data retrieved successfully",
        error: null,
        data: {
          owner_eng: houseData.ownerEng,
          owner_nepali: houseData.ownerNepali,
          total_family_members: houseData.totalFamilyMembers,
          family_death_within_1_year: houseData.familyDeathWithin_1Year,
          province: houseData.province,
          district: houseData.district,
          google_plus_code: houseData.googlePlusCode,
          longitude: houseData.longitude,
          latitude: houseData.latitude,
          ward_no: houseData.wardNo,
          house_id: houseId,
          family_members: familyMembers,
          toilet: houseData.digitalProfileToilets,
          drinking: houseData.digitalProfileDrinkingwatersurveys,
          electricity: houseData.digitalProfileLightingsources,
          loan: houseData.digitalProfileLoans,
          expense: houseData.digitalProfileExpenses,
          saving: houseData.digitalProfileSavings,
          vegetable: houseData.digitalProfileAgriculturevegetables,
          food: houseData.digitalProfileAgriculturefoodcrops,
          fruit: houseData.digitalProfileAgriculturefruits,
          flower: houseData.digitalProfileAgricultureflowers,
          oilseed: houseData.digitalProfileAgricultureoilseeds,
          cashcrops: houseData.digitalProfileAgriculturecashcrops,
          pulse: houseData.digitalProfileAgriculturepulses,
        },
      };

      return res.json(response);
    } catch (error) {
      console.error("Error retrieving house data:", error);
      next(error);
    }
  }

  //Stats

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const wardNo = req.query.wardNo
        ? parseInt(req.query.wardNo as string)
        : null;

      const [
        drinkingWaterSource,
        cookingFuelType,
        familySize,
        housingType,
        houses,
        familyMembers,
        schools,
        toilets,
        healthData,
        disabilityStatsQuery,
        educationData,
        wards,
        foreignWorkData,
        agricultureData,
      ] = await Promise.all([
        // 1. Drinking Water Stats
        this.digitalProfileRepo
          .createQueryBuilder("dw")
          .innerJoin("dw.digitalProfileDrinkingwatersurveys", "waterSource")
          .select("waterSource.mainSource", "source")
          .addSelect("CAST(COUNT(*) AS INTEGER)", "count")
          // Filter wardNo (if provided) and exclude NULL mainSource
          .where(wardNo ? "dw.wardNo = :wardNo" : "TRUE", { wardNo })
          .andWhere("waterSource.mainSource IS NOT NULL")
          .groupBy("waterSource.mainSource")
          .getRawMany(),

        // 2. Cooking Fuel Stats
        this.digitalProfileRepo
          .createQueryBuilder("cf")
          .innerJoin("cf.digitalProfileCookingfuels", "fuelSource")
          .select("fuelSource.mainFuel", "fuel")
          .addSelect("CAST(COUNT(*) AS INTEGER)", "count")
          .where(wardNo ? "cf.wardNo = :wardNo" : "TRUE", { wardNo })
          .andWhere("fuelSource.mainFuel IS NOT NULL")
          .groupBy("fuelSource.mainFuel")
          .getRawMany(),

        // 3. Family Size Stats
        this.digitalProfileRepo
          .createQueryBuilder("house")
          .select("house.totalFamilyMembers", "familySize")
          .addSelect("CAST(COUNT(*) AS INTEGER)", "count")
          .where(wardNo ? "house.wardNo = :wardNo" : "TRUE", { wardNo })
          .andWhere("house.totalFamilyMembers IS NOT NULL")
          .groupBy("house.totalFamilyMembers")
          .getRawMany(),

        // 4. Housing Types Stats
        this.digitalProfileRepo
          .createQueryBuilder("house")
          .innerJoin("house.digitalProfileBuildingdetails", "building")
          .select("building.typeOfHouse", "housingType")
          .addSelect("CAST(COUNT(*) AS INTEGER)", "count")
          .where(wardNo ? "house.wardNo = :wardNo" : "TRUE", { wardNo })
          .andWhere("building.typeOfHouse IS NOT NULL")
          .groupBy("building.typeOfHouse")
          .getRawMany(),

        // Houses query
        this.digitalProfileRepo
          .createQueryBuilder("house")
          .where(wardNo ? "house.wardNo = :wardNo" : "TRUE", { wardNo })
          .getMany(),

        // Family members query
        (async () => {
          const query =
            this.digitalProfileFamilymemberRepo.createQueryBuilder("fm");
          if (wardNo) {
            query
              .innerJoin(DigitalProfileHouse, "house", "fm.house_id = house.id")
              .where("house.wardNo = :wardNo", { wardNo });
          }
          return query.getMany();
        })(),

        // Schools query
        (async () => {
          const query = this.digitalProfileSchoolRepo
            .createQueryBuilder("school")
            .innerJoin(
              DigitalProfileHouse,
              "house",
              "school.house_id = house.id"
            );
          if (wardNo) {
            query.where("house.wardNo = :wardNo", { wardNo });
          }
          return query.getMany();
        })(),

        // Toilets query
        (async () => {
          const query = this.digitalProfileToiletRepo
            .createQueryBuilder("toilet")
            .innerJoin(
              DigitalProfileHouse,
              "house",
              "toilet.house_id = house.id"
            );
          if (wardNo) {
            query.where("house.wardNo = :wardNo", { wardNo });
          }
          return query.getMany();
        })(),

        // Single Health query
        (async () => {
          const query = this.digitalProfileHealthStatusRepo
            .createQueryBuilder("health")
            .innerJoin(
              DigitalProfileFamilymember,
              "member",
              "health.person_id = member.id"
            )
            .innerJoin(
              DigitalProfileHouse,
              "house",
              "member.house_id = house.id"
            );
          if (wardNo) {
            // Note: Adjust "house.ward_no" vs "house.wardNo" if your actual column differs
            query.where("house.ward_no = :wardNo", { wardNo });
          }
          return query.getMany();
        })(),

        // Disability query
        (async () => {
          const query = this.digitalProfileDisabiltiyStatusRepo
            .createQueryBuilder("disability")
            .innerJoin("disability.person", "person")
            .innerJoin("person.house", "house")
            .select("disability.statusOfDisability", "disabilityType")
            .addSelect("COUNT(*)", "occurrence")
            .where("disability.hasDisability = true");

          if (wardNo !== null) {
            query
              .addSelect("house.wardNo", "wardNo")
              .andWhere("house.wardNo = :wardNo", { wardNo });
          }

          return query
            .groupBy(
              wardNo !== null
                ? "house.wardNo, disability.statusOfDisability"
                : "disability.statusOfDisability"
            )
            .orderBy("occurrence", "DESC")
            .getRawMany();
        })(),

        // Education query
        // Education data query - fixed version
        // Education data query - corrected based on actual SQL
        (async () => {
          const query = this.digitalProfileEducationRepo
            .createQueryBuilder("education")
            .innerJoin(
              DigitalProfileFamilymember,
              "member",
              "education.person_id = member.id" // Use person.id since that's what's in the database
            )
            .innerJoin(
              DigitalProfileHouse,
              "house",
              "member.house_id = house.id"
            );

          if (wardNo) {
            // Note: Adjust "house.ward_no" vs "house.wardNo" if your actual column differs
            query.where("house.ward_no = :wardNo", { wardNo });
          }
          const result = await query.getMany();
          return result;
        })(),

        // Wards query
        (async () => {
          const query = this.wardRepo.createQueryBuilder("ward");
          if (wardNo) {
            query.where("ward.ward = :wardNo", { wardNo });
          }
          return query.getMany();
        })(),

        // Foreign work query
        (async () => {
          const query = this.digitalProfileCurrentLivingStatusRepo
            .createQueryBuilder("currentLiving")
            .innerJoin(
              DigitalProfileFamilymember,
              "member",
              "currentLiving.person_id = member.id"
            )
            .innerJoin(
              DigitalProfileHouse,
              "house",
              "member.house_id = house.id"
            )
            .where("currentLiving.country_name_if_foreign IS NOT NULL");
          if (wardNo) {
            query.andWhere("house.wardNo = :wardNo", { wardNo });
          }
          return query.getMany();
        })(),

        // Agriculture data queries
        Promise.all(
          [
            {
              name: "cashCropProduction",
              repo: this.digitalProfileAgriculturecashcropRepo,
              columns: {
                productName: "cash_crop_production",
                productionQuantity: "sales_result",
              },
            },
            {
              name: "cerealProduction",
              repo: this.digitalProfileAgriculturefoodcropRepo,
              columns: {
                productName: "food_production",
                productionQuantity: "sales_result",
              },
            },
            {
              name: "fruitProduction",
              repo: this.digitalProfileAgriculturefruitsRepo,
              columns: {
                productName: "fruit_production",
                productionQuantity: "sales_result",
              },
            },
            {
              name: "oilseedProduction",
              repo: this.digitalProfileAgricultureoilseedsRepo,
              columns: {
                productName: "oilseed_production",
                productionQuantity: "sales_result",
              },
            },
            {
              name: "pulseProduction",
              repo: this.digitalProfileAgriculturepulsesRepo,
              columns: {
                productName: "pulse_production",
                productionQuantity: "sales_result",
              },
            },
            {
              name: "vegetableProduction",
              repo: this.digitalProfileAgriculturevegetableRepo,
              columns: {
                productName: "veg_production",
                productionQuantity: "sales_result",
              },
            },
          ].map(async ({ name, repo, columns }) => {
            const query = repo
              .createQueryBuilder(name)
              .select([
                `${name}.${columns.productName} as productName`,
                `SUM(${name}.${columns.productionQuantity}) as totalProduction`,
              ])
              .groupBy(`${name}.${columns.productName}`);

            if (wardNo) {
              query
                .innerJoin(
                  DigitalProfileHouse,
                  "house",
                  `${name}.house_id = house.id`
                )
                .where("house.wardNo = :wardNo", { wardNo });
            }

            const data = await query.getRawMany();
            return {
              [name]: data
                .map((item) => ({
                  productName: item.productname,
                  totalProduction: item.totalproduction ?? 0,
                }))
                .filter((item) => item.productName !== null),
            };
          })
        ),
      ]);

      // -----------------------------
      // POST-QUERY PROCESSING SECTION
      // -----------------------------

      // Flatten agriculture data
      const agricultureDataFlattened = Object.assign({}, ...agricultureData);

      // From the single healthData query, derive the "healthData2" (subset with status_of_health = 'स्वस्थ')
      const healthData2 = healthData.filter(
        (health) => health.statusOfHealth === "स्वस्थ"
      );

      // Now compute totalHealthTreatments exactly as before
      const totalHealthTreatments = healthData2.length;

      // Next, derive dropout stats, dropout reasons, and qualification types directly from "educationData".
      // This replaces the separate queries for dropoutStats, dropoutReasons, and qualificationTypes.
      const dropoutStatsMap: Record<string, number> = {};
      const dropoutReasonsMap: Record<string, number> = {};
      const qualificationTypesMap: Record<string, number> = {};

      for (const edu of educationData) {
        // Grouping by hasEndedStudyAbruptly - this should count all records
        const endedKey =
          edu.hasEndedStudyAbruptly === true
            ? "true"
            : edu.hasEndedStudyAbruptly === false
            ? "false"
            : "unknown";
        dropoutStatsMap[endedKey] = (dropoutStatsMap[endedKey] || 0) + 1;

        // Only count reasonToEndStudy for actual dropouts
        if (edu.hasEndedStudyAbruptly === true && edu.reasonToEndStudy) {
          const reasonKey = edu.reasonToEndStudy;
          dropoutReasonsMap[reasonKey] =
            (dropoutReasonsMap[reasonKey] || 0) + 1;
        }

        // Grouping by educationQualificationType (for all records)
        if (edu.educationQualificationType) {
          const qualKey = edu.educationQualificationType;
          qualificationTypesMap[qualKey] =
            (qualificationTypesMap[qualKey] || 0) + 1;
        }
      }

      // Convert these maps to the same shapes that were originally produced by .getRawMany() calls
      const dropoutStats = Object.entries(dropoutStatsMap).map(
        ([status, population]) => ({
          status,
          population: population.toString(),
        })
      );

      const dropoutReasons = Object.entries(dropoutReasonsMap).map(
        ([reason, population]) => ({
          reason,
          population: population.toString(),
        })
      );

      const qualificationTypes = Object.entries(qualificationTypesMap).map(
        ([qualificationType, population]) => ({
          qualificationType,
          population: population.toString(),
        })
      );

      // Convert them to final mapped arrays exactly as before
      const dropOutStatsResult = dropoutStats.map((record) => ({
        status:
          record.status === "true"
            ? "Dropped Out"
            : record.status === "false"
            ? "Not Dropped Out"
            : "Unknown",
        population: parseInt(record.population, 10),
      }));

      const formattedDropoutReasons = dropoutReasons
        .map((record) => ({
          reason: record.reason || "Unknown",
          population: parseInt(record.population, 10),
        }))
        .filter((record) => record.reason !== "Unknown");

      const formattedQualificationTypes = qualificationTypes.map((record) => ({
        qualificationType: record.qualificationType || "Unknown",
        population: parseInt(record.population, 10),
      }));

      // Process other results
      const totalHouseholds = houses.length;
      const totalPopulation = familyMembers.length;
      const malePop = familyMembers.filter(
        (fm) => fm.gender === "पुरुष"
      ).length;
      const femalePop = totalPopulation - malePop;
      const totalSchools = schools.length;
      const totalToilets = toilets.length;
      const totalEducations = educationData.length;

      // Wards area
      let totalArea = 0;
      if (wards.length > 0) {
        totalArea = wards.reduce(
          (sum: number, ward: any) => sum + (ward.areaSqkm || 0),
          0
        );
      }

      // Calculate literacy rate
      const literacyCount = educationData.filter(
        (edu) => edu.isLiterate
      ).length;
      const literacyRate = totalPopulation
        ? (literacyCount / totalPopulation) * 100
        : 0;

      // Format disability stats
      const disabilityStats =
        wardNo !== null
          ? disabilityStatsQuery.map((record) => ({
              disability: record.disabilityType,
              population: parseInt(record.occurrence, 10),
            }))
          : disabilityStatsQuery.map((record) => ({
              disability: record.disabilityType,
              population: parseInt(record.occurrence, 10),
            }));

      // Prepare household data
      const houseHoldData = {
        drinkingWaterSource,
        cookingFuelType,
        familySize,
        housingType,
      };

      // Prepare highlights (keep the same logic)
      const highlights = {
        households: totalHouseholds ? totalHouseholds.toLocaleString() : null,
        population: totalPopulation ? totalPopulation.toLocaleString() : null,
        malePop: malePop ? malePop.toLocaleString() : null,
        femalePop: femalePop ? femalePop.toLocaleString() : null,
        area: totalArea ? totalArea.toLocaleString() : null,
        literacy: literacyRate ? literacyRate.toLocaleString() : null,
        schools: totalSchools ? totalSchools.toLocaleString() : null,
      };

      // Filter out null values from highlights
      const filteredHighlights = Object.fromEntries(
        Object.entries(highlights).filter(([_, value]) => value !== null)
      );

      // Helper functions for data processing (kept the same)
      const getMaritalStatusData = (familyMembers: any) =>
        familyMembers.reduce((acc: any, fm: any) => {
          acc[fm.maritalStatus] = (acc[fm.maritalStatus] || 0) + 1;
          return acc;
        }, {});

      const getCasteData = (familyMembers: any) =>
        familyMembers.reduce((acc: any, fm: any) => {
          acc[fm.caste] = (acc[fm.caste] || 0) + 1;
          return acc;
        }, {});

      const getReligionData = (familyMembers: any) =>
        familyMembers.reduce((acc: any, fm: any) => {
          acc[fm.religion] = (acc[fm.religion] || 0) + 1;
          return acc;
        }, {});

      const getBloodGroupData = (familyMembers: any) =>
        familyMembers.reduce((acc: any, fm: any) => {
          acc[fm.bloodGroup] = (acc[fm.bloodGroup] || 0) + 1;
          return acc;
        }, {});

      const getMotherLanguageData = (familyMembers: any) =>
        familyMembers.reduce((acc: any, fm: any) => {
          acc[fm.language] = (acc[fm.language] || 0) + 1;
          return acc;
        }, {});

      const getOccupationData = (familyMembers: any) =>
        familyMembers.reduce((acc: any, fm: any) => {
          acc[fm.occupation] = (acc[fm.occupation] || 0) + 1;
          return acc;
        }, {});

      const getForeignWorkLocationData = (foreignWorkData: any) =>
        foreignWorkData.reduce((acc: any, status: any) => {
          if (status.digitalProfileCurrentlivingstatuses) {
            acc[status.digitalProfileCurrentlivingstatuses] =
              (acc[status.digitalProfileCurrentlivingstatuses] || 0) + 1;
          }
          return acc;
        }, {});

      const getDiseasePrevalenceData = (healthData: any) =>
        healthData.reduce((acc: any, health: any) => {
          acc[health.diseaseName] = (acc[health.diseaseName] || 0) + 1;
          return acc;
        }, {});

      const getLiteracyRateData = (educationData: any) =>
        educationData.reduce((acc: any, edu: any) => {
          acc[edu.isLiterate] = (acc[edu.isLiterate] || 0) + 1;
          return acc;
        }, {});

      const getEducationLevelData = (educationData: any) =>
        educationData.reduce((acc: any, edu: any) => {
          acc[edu.educationDegree] = (acc[edu.educationDegree] || 0) + 1;
          return acc;
        }, {});

      // Prepare final stats object (unchanged structure)
      const stats = {
        population: {
          maritalStatus: Object.entries(getMaritalStatusData(familyMembers))
            .map(([maritalStatus, count]) => ({ maritalStatus, count }))
            .filter((item) => item.maritalStatus !== "null"),
          caste: Object.entries(getCasteData(familyMembers))
            .map(([caste, count]) => ({ caste, count }))
            .filter((item) => item.caste !== "null"),
          religion: Object.entries(getReligionData(familyMembers))
            .map(([religion, count]) => ({ religion, count }))
            .filter((item) => item.religion !== "null"),
          bloodGroup: Object.entries(getBloodGroupData(familyMembers))
            .map(([bloodGroup, count]) => ({ bloodGroup, count }))
            .filter((item) => item.bloodGroup !== "null"),
          gender: [
            { gender: "पुरुष", population: malePop },
            { gender: "महिला", population: femalePop },
          ].filter((item) => item.gender !== "null"),
          motherLanguage: Object.entries(getMotherLanguageData(familyMembers))
            .map(([language, count]) => ({ language, count }))
            .filter((item) => item.language !== "null"),
        },
        employment: {
          occupation: Object.entries(getOccupationData(familyMembers))
            .map(([occupation, count]) => ({ occupation, count }))
            .filter((item) => item.occupation !== "null"),
          foreignWorkLocation: Object.entries(
            getForeignWorkLocationData(foreignWorkData)
          )
            .map(([country, count]) => ({ country, count }))
            .filter((item) => item.country !== "null"),
        },
        health: {
          healthStatus: [
            {
              status: "स्वस्थ",
              population: totalPopulation - totalHealthTreatments,
            },
            { status: "अस्वस्थ", population: totalHealthTreatments },
          ].filter((item) => item.status !== "null"),
          diseasePrevalence: Object.entries(
            getDiseasePrevalenceData(healthData)
          )
            .map(([disease, count]) => ({ disease, count }))
            .filter((item) => item.disease !== "null"),
          disabilityType: disabilityStats,
        },
        education: {
          literacyRate: Object.entries(getLiteracyRateData(educationData))
            .map(([status, count]) => ({
              status: status === "true" ? "Literate" : "Illiterate",
              count,
            }))
            .filter((item) => item.status !== "null"),
          educationLevel: Object.entries(getEducationLevelData(educationData))
            .map(([educationLevel, count]) => ({ educationLevel, count }))
            .filter((item) => item.educationLevel !== "null"),
          schoolDropoutRate: dropOutStatsResult,
          dropoutReasons: formattedDropoutReasons,
          qualificationTypes: formattedQualificationTypes,
        },
        agricultureData: agricultureDataFlattened,
        householdData: houseHoldData,
      };

      return res.json({
        status: 200,
        success: true,
        message: "Stats retrieved successfully",
        data: {
          highlights: filteredHighlights,
          stats: stats,
        },
      });
    } catch (error) {
      next(error);
      console.error(error);
    }
  }

  //map-view
  async getGeojsonForMapView(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        family_size_array,
        language_array,
        caste_array,
        gender_array,
        marital_status_array,
        occupations_array,
        religions_array,
        bloodGroups_array,
        disabilities_array,
        diseases_array,
        literacy_rates_array,
        work_foreign_array,
        work_foreign_place_array,
        drinking_water_array,
        toilet_array,
        cash_crop_array,
        vegetable_array,
        pulse_array,
        oilseed_array,
        fruit_array,
        family_death,
        health_status_array,
        education_levels_array,
        school_dropouts_array,
        dropout_reasons_array,
      } = req.body;

      const ward = req.query.ward ? Number(req.query.ward) : null;

      // Validate input arrays
      const validateArray = (array: any, name: string) => {
        if (array && !Array.isArray(array)) {
          res.status(400).json({ message: `Invalid ${name}` });
          return null;
        }
        return array || [];
      };

      const languages = validateArray(language_array, "language_array");
      const castes = validateArray(caste_array, "caste_array");
      const genders = validateArray(gender_array, "gender_array");
      const maritalStatuses = validateArray(
        marital_status_array,
        "marital_status_array"
      );
      const occupations = validateArray(occupations_array, "occupations_array");
      const religions = validateArray(religions_array, "religions_array");
      const bloodGroups = validateArray(bloodGroups_array, "bloodGroups_array");
      const disablities = validateArray(
        disabilities_array,
        "disabilities_array"
      );
      const diseases = validateArray(diseases_array, "diseases_array");
      const literateStatus = validateArray(
        literacy_rates_array,
        "literacy_rates_array"
      );
      const foreignWorkStatus = validateArray(
        work_foreign_array,
        "work_foreign_array"
      );
      const foreignWorkPlace = validateArray(
        work_foreign_place_array,
        "work_foreign_place_array"
      );
      const drinkingWaterSources = validateArray(
        drinking_water_array,
        "drinking_water_array"
      );
      const toiletType = validateArray(toilet_array, "toilet_array");
      const cashCrops = validateArray(cash_crop_array, "cash_crop_array");
      const vegetables = validateArray(vegetable_array, "vegetable_array");
      const pulses = validateArray(pulse_array, "pulse_array");
      const oilSeeds = validateArray(oilseed_array, "oilseed_array");
      const fruits = validateArray(fruit_array, "fruit_array");
      const deathInFamilyWithinAYear = validateArray(
        family_death,
        "family_death_array"
      );
      const familySize = validateArray(family_size_array, "family_size_array");
      // Validate arrays
      const healthStatusArray = validateArray(
        health_status_array,
        "health_status_array"
      );
      const educationLevelsArray = validateArray(
        education_levels_array,
        "education_levels_array"
      );
      const schoolDropoutsArray = validateArray(
        school_dropouts_array,
        "school_dropouts_array"
      );
      const dropoutReasonsArray = validateArray(
        dropout_reasons_array,
        "dropout_reasons_array"
      );

      if (
        languages === null ||
        castes === null ||
        genders === null ||
        maritalStatuses === null ||
        occupations === null ||
        religions === null ||
        bloodGroups === null ||
        diseases === null ||
        literateStatus === null ||
        disablities === null ||
        literateStatus === null ||
        foreignWorkStatus === null ||
        foreignWorkPlace === null ||
        drinkingWaterSources === null ||
        toiletType === null ||
        cashCrops === null ||
        vegetables === null ||
        pulses === null ||
        oilSeeds === null ||
        fruits === null ||
        deathInFamilyWithinAYear === null ||
        familySize === null ||
        healthStatusArray === null ||
        educationLevelsArray === null ||
        schoolDropoutsArray === null ||
        dropoutReasonsArray === null
      ) {
        return; // Exit if any array validation fails
      }

      const mappedFamilySize = familySize.map(
        (size: string) => FAMILY_SIZE_MAPPING[size]
      );
      const mappedLanguages = languages.map(
        (lang: string) => LANGUAGE_MAPPING[lang]
      );
      const mappedCastes = castes.map((caste: string) => CASTE_MAPPING[caste]);
      const mappedGenders = genders.map(
        (gender: string) => GENDER_MAPPING[gender]
      );
      const mappedMaritalStatuses = maritalStatuses.map(
        (status: string) => MARITAL_STATUS_MAPPING[status]
      );
      const mappedOccupations = occupations.map(
        (occupation: string) => OCCUPATION_MAPPING[occupation]
      );
      const mappedReligions = religions.map(
        (religion: string) => RELIGION_MAPPING[religion]
      );
      const mappedBloodGroups = bloodGroups.map(
        (bloodGroup: string) => BLOOD_GROUP_MAPPING[bloodGroup]
      );

      const mappedDisabilties = disablities.map(
        (disability: string) => DISABILITY_MAPPING[disability]
      );
      const mappedDiseases = diseases.map(
        (disease: string) => DISEASE_MAPPING[disease]
      );

      const mappedLiterateStatus = literateStatus.map(
        (literate: string) => LITERACY_RATE_MAPPING[literate]
      );

      const mappedForeignWorkStatus = foreignWorkStatus.map(
        (foreign: string) => FOREIGN_EMPLOYMENT_MAPPING[foreign]
      );
      const mappedForeignWorkPlace = foreignWorkPlace.map(
        (foreignPlace: string) => FOREIGN_WORK_MAPPING[foreignPlace]
      );

      const mappedDrinkingWaterSource = drinkingWaterSources.map(
        (drinkingWaterSource: string) =>
          DRINKING_WATER_MAPPING[drinkingWaterSource]
      );

      const mappedToiletType = toiletType.map(
        (toilet: string) => TOILET_MAPPING[toilet]
      );

      const mappedCashCrop = cashCrops.map(
        (cashCrop: string) => CASH_CROP_MAPPING[cashCrop]
      );

      const mappedVegetables = vegetables.map(
        (vegetable: string) => VEGETABLE_MAPPING[vegetable]
      );
      const mappedPulses = pulses.map((pulse: string) => PULSE_MAPPING[pulse]);
      const mappedOilSeeds = oilSeeds.map(
        (oilSeed: string) => OILSEED_MAPPING[oilSeed]
      );
      const mappedFruits = fruits.map((fruit: string) => FRUIT_MAPPING[fruit]);

      const mappedDeathInFamilyWithinAYear = deathInFamilyWithinAYear.map(
        (death: string) => FAMILY_DEATH_MAPPING[death]
      );

      // Ensure the arrays are not null before mapping
      const mappedHealthStatus = healthStatusArray
        ? healthStatusArray.map(
            (status: string) => HEALTH_STATUS_MAPPING[status]
          )
        : [];

      const mappedEducationLevels = educationLevelsArray
        ? educationLevelsArray.map(
            (level: string) => EDUCATION_LEVEL_MAPPING[level]
          )
        : [];

      const mappedSchoolDropouts = schoolDropoutsArray
        ? schoolDropoutsArray.map(
            (dropout: string) => SCHOOL_DROPOUT_MAPPING[dropout]
          )
        : [];

      const mappedDropoutReasons = dropoutReasonsArray
        ? dropoutReasonsArray.map(
            (reason: string) => DROPOUT_REASON_MAPPING[reason]
          )
        : [];

      // Create the query builder
      let query = this.digitalProfileRepo.createQueryBuilder("house");

      // Match houses where total_family_members is in the familySizes array if family_size_array is provided
      if (mappedFamilySize.length > 0) {
        query = query.andWhere(
          "house.total_family_members IN (:...familySizes)",
          {
            familySizes: mappedFamilySize,
          }
        );
      }

      // Filter by ward if provided
      if (ward !== null && ward !== undefined) {
        query = query.andWhere("house.ward_no = :ward", { ward });
      }

      // Join with family member table and add additional filters
      query = query.leftJoinAndSelect(
        "house.digitalProfileFamilymembers",
        "familyMember"
      );

      query = query.leftJoinAndSelect(
        "familyMember.digitalProfileDisabilitystatuses",
        "disabilityRecord"
      );
      query = query.leftJoinAndSelect(
        "familyMember.digitalProfileHealthstatuses",
        "healthRecord"
      );

      query = query.leftJoinAndSelect(
        "familyMember.digitalProfileEducation",
        "educationRecord"
      );

      query = query.leftJoinAndSelect(
        "familyMember.digitalProfileCurrentlivingstatuses",
        "ForeignRecord"
      );

      query = query.leftJoinAndSelect(
        "house.digitalProfileDrinkingwatersurveys",
        "drinkingWaterRecord"
      );

      query = query.leftJoinAndSelect(
        "house.digitalProfileToilets",
        "toiletRecord"
      );

      query = query.leftJoinAndSelect(
        "house.digitalProfileAgriculturecashcrops",
        "cashCropRecord"
      );

      //vegetables
      query = query.leftJoinAndSelect(
        "house.digitalProfileAgriculturevegetables",
        "vegetableRecord"
      );

      //pulses
      query = query.leftJoinAndSelect(
        "house.digitalProfileAgriculturepulses",
        "pulseRecord"
      );

      //oilSeeds
      query = query.leftJoinAndSelect(
        "house.digitalProfileAgricultureoilseeds",
        "oilSeedRecord"
      );

      //fruits
      query = query.leftJoinAndSelect(
        "house.digitalProfileAgriculturefruits",
        "fruitRecord"
      );

      if (mappedLanguages.length > 0) {
        query = query.andWhere("familyMember.language IN (:...languages)", {
          languages: mappedLanguages,
        });
      }
      if (mappedCastes.length > 0) {
        query = query.andWhere("familyMember.caste IN (:...castes)", {
          castes: mappedCastes,
        });
      }
      if (mappedGenders.length > 0) {
        query = query.andWhere("familyMember.gender IN (:...genders)", {
          genders: mappedGenders,
        });
      }
      if (mappedMaritalStatuses.length > 0) {
        query = query.andWhere(
          "familyMember.marital_status IN (:...maritalStatuses)",
          { maritalStatuses: mappedMaritalStatuses }
        );
      }
      if (mappedOccupations.length > 0) {
        query = query.andWhere("familyMember.occupation IN (:...occupations)", {
          occupations: mappedOccupations,
        });
      }
      if (mappedReligions.length > 0) {
        query = query.andWhere("familyMember.religion IN (:...religions)", {
          religions: mappedReligions,
        });
      }
      if (mappedBloodGroups.length > 0) {
        query = query.andWhere(
          "familyMember.blood_group IN (:...bloodGroups)",
          {
            bloodGroups: mappedBloodGroups,
          }
        );
      }

      if (mappedDisabilties.length > 0) {
        query = query.andWhere(
          "disabilityRecord.status_of_disability IN (:...disablities)",
          {
            disablities: mappedDisabilties,
          }
        );
      }

      if (mappedDiseases.length > 0) {
        query = query.andWhere("healthRecord.disease_name IN (:...diseases)", {
          diseases: mappedDiseases,
        });
      }
      if (mappedLiterateStatus.length > 0) {
        query = query.andWhere("educationRecord.isLiterate IN (:...literate)", {
          literate: mappedLiterateStatus,
        });
      }
      if (mappedForeignWorkStatus.length > 0) {
        query = query.andWhere(
          "ForeignRecord.living_status IN (:...workPlaceStatus)",
          {
            workPlaceStatus: mappedForeignWorkStatus,
          }
        );
      }
      if (mappedForeignWorkPlace.length > 0) {
        query = query.andWhere(
          "ForeignRecord.country_name_if_foreign IN (:...workPlace)",
          {
            workPlace: mappedForeignWorkPlace,
          }
        );
      }
      if (mappedDrinkingWaterSource.length > 0) {
        query = query.andWhere(
          "drinkingWaterRecord.main_source IN (:...drinkingWaterSources)",
          {
            drinkingWaterSources: mappedDrinkingWaterSource,
          }
        );
      }
      if (mappedToiletType.length > 0) {
        query = query.andWhere("toiletRecord.toilet_type IN (:...toiletType)", {
          toiletType: mappedToiletType,
        });
      }
      if (mappedCashCrop.length > 0) {
        query = query.andWhere(
          "cashCropRecord.cash_crop_production IN (:...cashCrops)",
          {
            cashCrops: mappedCashCrop,
          }
        );
      }
      if (mappedVegetables.length > 0) {
        query = query.andWhere(
          "vegetableRecord.veg_production IN (:...vegProductions)",
          {
            vegProductions: mappedVegetables,
          }
        );
      }
      if (mappedPulses.length > 0) {
        query = query.andWhere(
          "pulseRecord.pulse_production IN (:...pulseProductions)",
          {
            pulseProductions: mappedPulses,
          }
        );
      }
      if (mappedOilSeeds.length > 0) {
        query = query.andWhere(
          "oilSeedRecord.oilseed_production IN (:...oilSeedProductions)",
          {
            oilSeedProductions: mappedOilSeeds,
          }
        );
      }
      if (mappedFruits.length > 0) {
        query = query.andWhere(
          "fruitRecord.fruit_production IN (:...fruitProductions)",
          {
            fruitProductions: mappedFruits,
          }
        );
      }

      if (mappedDeathInFamilyWithinAYear.length > 0) {
        query = query.andWhere(
          "house.family_death_within_1_year IN (:...deathInFamilyWithinAYear)",
          {
            deathInFamilyWithinAYear: mappedDeathInFamilyWithinAYear,
          }
        );
      }

      if (mappedHealthStatus.length > 0) {
        query = query.andWhere(
          "healthRecord.status_of_health IN (:...healthStatus)",
          {
            healthStatus: mappedHealthStatus,
          }
        );
      }
      if (mappedEducationLevels.length > 0) {
        query = query.andWhere(
          "educationRecord.education_degree IN (:...educationDegree)",
          {
            educationDegree: mappedEducationLevels,
          }
        );
      }
      if (mappedSchoolDropouts.length > 0) {
        query = query.andWhere(
          "educationRecord.has_ended_study_abruptly IN (:...schoolDropout)",
          {
            schoolDropout: mappedSchoolDropouts,
          }
        );
      }
      if (mappedDropoutReasons.length > 0) {
        query = query.andWhere(
          "educationRecord.reason_to_end_study IN (:...dropoutReason)",
          {
            dropoutReason: mappedDropoutReasons,
          }
        );
      }

      // Execute query
      const houses = await query.getMany();

      // Ensure no duplicate houses by using a Set
      const uniqueHouses = Array.from(
        new Set(houses.map((house) => house.houseId))
      ).map((id) => houses.find((house) => house.houseId === id));

      const formattedReponse = uniqueHouses.map((house) => {
        return {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [house?.latitude, house?.longitude],
          },
          properties: {
            wardNo: house?.wardNo,
            googlePlusCode: house?.googlePlusCode,
            district: house?.district,
            province: house?.province,
            ownerEng: house?.ownerEng,
            ownerNepali: house?.ownerNepali,
            totalFamilyMembers: house?.totalFamilyMembers,
            familyDeathWithin_1Year: house?.familyDeathWithin_1Year,
            houseId: house?.houseId,
          },
        };
      });

      return res.status(200).json({
        status: 200,
        success: true,
        message: "Digital Profile Map Data Retreived Successfully",
        data: formattedReponse,
      });
    } catch (error) {
      console.error(error);
      next(error); // Pass error to global error handler
    }
  }

  //add new house
  async addHouse(req: Request, res: Response, next: NextFunction) {
    const {
      owner_eng,
      owner_nepali,
      family_death_within_1_year,
      google_plus_code,
      ward_no,
    } = req.body;

    try {
      // Validate required fields
      if (!owner_eng || !owner_nepali || ward_no === undefined) {
        throw new HttpError(
          400,
          "Missing required fields: owner_eng, owner_nepali, and ward_no are mandatory."
        );
      }

      // Create the new house object
      const newHouse = this.digitalProfileRepo.create({
        ownerEng: owner_eng,
        ownerNepali: owner_nepali,
        familyDeathWithin_1Year: family_death_within_1_year,
        googlePlusCode: google_plus_code,
        wardNo: parseInt(ward_no),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Save to the database
      const savedHouse = await this.digitalProfileRepo.save(newHouse);

      // Construct the response
      const response = {
        status: 201,
        success: true,
        message: "House added successfully.",
        error: null,
        data: {
          house_id: savedHouse.houseId,
          owner_eng: savedHouse.ownerEng,
          owner_nepali: savedHouse.ownerNepali,
          family_death_within_1_year: savedHouse.familyDeathWithin_1Year,
          google_plus_code: savedHouse.googlePlusCode,
          ward_no: savedHouse.wardNo,
          created_at: savedHouse.createdAt,
          updated_at: savedHouse.updatedAt,
        },
      };

      return res.status(201).json(response);
    } catch (error) {
      console.error("Error adding new house:", error);
      next(error);
    }
  }

  //Edit House Details
  async editHouse(req: Request, res: Response, next: NextFunction) {
    const houseId = parseInt(req.params.houseId);

    try {
      // Find the house to edit
      const existingHouse = await this.digitalProfileRepo.findOne({
        where: { houseId },
      });

      if (!existingHouse) {
        return res.status(404).json({
          status: 404,
          success: false,
          message: "House not found",
          error: null,
          data: null,
        });
      }

      // Update the attributes with new data
      const data = req.body;

      existingHouse.googlePlusCode =
        data?.google_plus_code || existingHouse.googlePlusCode || "";
      existingHouse.wardNo = data?.ward_no || existingHouse.wardNo || null;
      existingHouse.totalFamilyMembers =
        data?.total_family_members || existingHouse.totalFamilyMembers || null;
      existingHouse.familyDeathWithin_1Year =
        data?.family_death_within_1_year !== undefined
          ? data.family_death_within_1_year
          : existingHouse.familyDeathWithin_1Year || false;
      existingHouse.ownerEng = data?.owner_eng || existingHouse.ownerEng || "";
      existingHouse.ownerNepali =
        data?.owner_nepali || existingHouse.ownerNepali || "";

      // Save the updated house data
      await this.digitalProfileRepo.save(existingHouse);

      // Return success response
      return res.status(200).json({
        status: 200,
        success: true,
        message: "House updated successfully",
        error: null,
        data: {
          house_id: existingHouse.houseId,
          google_plus_code: existingHouse.googlePlusCode,
          ward_no: existingHouse.wardNo,
          total_family_members: existingHouse.totalFamilyMembers,
          family_death_within_1_year: existingHouse.familyDeathWithin_1Year,
          owner_eng: existingHouse.ownerEng,
          owner_nepali: existingHouse.ownerNepali,
        },
      });
    } catch (error) {
      console.error("Error updating house data:", error);
      next(error);
    }
  }

  //delete house
  async deleteHouse(req: Request, res: Response, next: NextFunction) {
    const houseId = parseInt(req.params.houseId);

    try {
      // Check if the house exists
      const house = await this.digitalProfileRepo.findOne({
        where: { houseId },
      });

      if (!house) {
        return res.status(404).json({
          status: 404,
          success: false,
          message: "House not found",
          error: null,
          data: null,
        });
      }

      // Delete the house
      await this.digitalProfileRepo.remove(house);

      // Return success response
      return res.status(200).json({
        status: 200,
        success: true,
        message: "House deleted successfully",
        error: null,
        data: {
          house_id: houseId,
        },
      });
    } catch (error) {
      console.error("Error deleting house:", error);
      next(error);
    }
  }

  //Add Family member
  async addFamilyMember(req: Request, res: Response, next: NextFunction) {
    const { houseId } = req.params;
    const {
      first_name,
      last_name,
      dob,
      gender,
      full_name_eng,
      relation_with_family_head,
      email,
      mobile_no,
      blood_group,
      caste,
      religion,
      language,
      occupation,
      marital_status,
      skill,
      interest_areas,
      is_literate,
      education_degree,
      has_study_ended_abruptly,
      reason_to_end_study,
      branch_of_study,
      education_passed_year,
      education_qualification_type,
      division_of_study,
      percentage,
      gpa,
      education_institution_name,
    } = req.body;

    try {
      // Validate the house exists
      const house = await this.digitalProfileRepo.findOne({
        where: { houseId: parseInt(houseId) },
      });

      if (!house) {
        return res.status(404).json({
          status: 404,
          success: false,
          message: "House not found",
          error: null,
          data: null,
        });
      }

      // Create new family member instance
      const newFamilyMember = this.digitalProfileFamilymemberRepo.create({
        firstName: first_name || null,
        lastName: last_name || null,
        dob: dob || null,
        gender: gender || null,
        fullNameEng: full_name_eng || null,
        relationWithFamilyHead: relation_with_family_head || null,
        email: email || null,
        mobileNo: mobile_no || null,
        bloodGroup: blood_group || null,
        caste: caste || null,
        religion: religion || null,
        language: language || null,
        occupation: occupation || null,
        maritalStatus: marital_status || null,
        skill: skill || null,
        interestAreas: interest_areas || null,
        house: house,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Save the family member to the database
      const savedFamilyMember = await this.digitalProfileFamilymemberRepo.save(
        newFamilyMember
      );
      // Create education details for the family member
      const newEducation = this.digitalProfileEducationRepo.create({
        isLiterate: is_literate || null,
        educationDegree: education_degree || null,
        hasEndedStudyAbruptly: has_study_ended_abruptly || null,
        reasonToEndStudy: reason_to_end_study || null,
        branchOfStudy: branch_of_study || null,
        educationQualificationType: education_qualification_type || null,
        divisionOfStudy: division_of_study || null,
        percentage: percentage || null,
        gpa: gpa || null,
        educationInstitutionName: education_institution_name || null,
        educationPassedYear: education_passed_year || null,
        person: savedFamilyMember, // Link education to the family member
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Save the education details to the database
      const savedEducation = await this.digitalProfileEducationRepo.save(
        newEducation
      );

      // Return success response
      return res.status(201).json({
        status: 201,
        success: true,
        message: "Family member added successfully",
        error: null,
        data: "",
      });
    } catch (error) {
      console.error("Error adding family member:", error);
      next(error);
    }
  }

  //Edit Family Member
  async editFamilyMember(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params; // Family member ID
    const {
      first_name,
      last_name,
      dob,
      gender,
      full_name_eng,
      relation_with_family_head,
      email,
      mobile_no,
      blood_group,
      caste,
      religion,
      language,
      occupation,
      marital_status,
      skill,
      interest_areas,
      is_literate,
      education_degree,
      has_study_ended_abruptly,
      reason_to_end_study,
      branch_of_study,
      education_passed_year,
      education_qualification_type,
      division_of_study,
      percentage,
      gpa,
      education_institution_name,
    } = req.body;

    try {
      // Validate that the family member exists
      const familyMember = await this.digitalProfileFamilymemberRepo.findOne({
        where: { personId: parseInt(id) },
        relations: ["digitalProfileEducation"], // Fetch related education
      });

      if (!familyMember) {
        return res.status(404).json({
          status: 404,
          success: false,
          message: "Family member not found",
          error: null,
          data: null,
        });
      }

      // Update family member fields only if provided
      familyMember.firstName = first_name || familyMember.firstName;
      familyMember.lastName = last_name || familyMember.lastName;
      familyMember.dob = dob || familyMember.dob;
      familyMember.gender = gender || familyMember.gender;
      familyMember.fullNameEng = full_name_eng || familyMember.fullNameEng;
      familyMember.relationWithFamilyHead =
        relation_with_family_head || familyMember.relationWithFamilyHead;
      familyMember.email = email || familyMember.email;
      familyMember.mobileNo = mobile_no || familyMember.mobileNo;
      familyMember.bloodGroup = blood_group || familyMember.bloodGroup;
      familyMember.caste = caste || familyMember.caste;
      familyMember.religion = religion || familyMember.religion;
      familyMember.language = language || familyMember.language;
      familyMember.occupation = occupation || familyMember.occupation;
      familyMember.maritalStatus = marital_status || familyMember.maritalStatus;
      familyMember.skill = skill || familyMember.skill;
      familyMember.interestAreas = interest_areas || familyMember.interestAreas;
      familyMember.updatedAt = new Date();

      // Update the related education details if provided
      if (familyMember.digitalProfileEducation) {
        const education = familyMember.digitalProfileEducation;

        education.isLiterate = is_literate || education.isLiterate;
        education.educationDegree =
          education_degree || education.educationDegree;
        education.hasEndedStudyAbruptly =
          has_study_ended_abruptly || education.hasEndedStudyAbruptly;
        education.reasonToEndStudy =
          reason_to_end_study || education.reasonToEndStudy;
        education.branchOfStudy = branch_of_study || education.branchOfStudy;
        education.educationQualificationType =
          education_qualification_type || education.educationQualificationType;
        education.divisionOfStudy =
          division_of_study || education.divisionOfStudy;
        education.percentage = percentage || education.percentage;
        education.gpa = gpa || education.gpa;
        education.educationInstitutionName =
          education_institution_name || education.educationInstitutionName;
        education.educationPassedYear =
          education_passed_year || education.educationPassedYear;
        education.updatedAt = new Date();

        // Save the updated education details
        await this.digitalProfileEducationRepo.save(education);
      }

      // Save the updated family member details
      const updatedFamilyMember =
        await this.digitalProfileFamilymemberRepo.save(familyMember);

      // Return success response
      return res.status(200).json({
        status: 200,
        success: true,
        message: "Family member and education details updated successfully",
        error: null,
        data: "",
      });
    } catch (error) {
      console.error("Error updating family member:", error);
      next(error);
    }
  }

  //Delete Family Member
  async deleteFamilyMember(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params; // Family member ID

    try {
      // Find the family member to delete
      const familyMember = await this.digitalProfileFamilymemberRepo.findOne({
        where: { personId: parseInt(id) },
      });

      if (!familyMember) {
        return res.status(404).json({
          status: 404,
          success: false,
          message: "Family member not found",
          error: null,
          data: null,
        });
      }

      // Delete the family member
      await this.digitalProfileFamilymemberRepo.remove(familyMember);

      // Return success response
      return res.status(200).json({
        status: 200,
        success: true,
        message: "Family member deleted successfully",
        error: null,
        data: null,
      });
    } catch (error) {
      console.error("Error deleting family member:", error);
      next(error);
    }
  }
}
export default new DigitalProfileController();

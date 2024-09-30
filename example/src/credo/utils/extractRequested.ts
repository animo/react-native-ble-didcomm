import type { AnonCredsRequestedPredicate } from '@credo-ts/anoncreds'
import { JsonTransformer } from '@credo-ts/core'
import type { FormattedProof } from './createBleProofMessage'

export const extractRequestAttributes = (data: FormattedProof): Record<string, string> => {
  const requestedAttributes = data.request.anoncreds?.requested_attributes ?? {}
  const revealedAttributes = data.presentation.anoncreds?.requested_proof.revealed_attrs ?? {}
  const revealedAttributeGroups = data.presentation.anoncreds?.requested_proof.revealed_attr_groups ?? {}

  const result: Record<string, string> = {}

  for (const attribute in revealedAttributes) {
    const attrName = requestedAttributes[attribute]?.name
    const revealedValue = revealedAttributes[attribute]?.raw

    if (attrName && revealedValue) result[attrName] = revealedValue
  }

  // map the requested attributes to the revealed values
  for (const attribute in revealedAttributeGroups) {
    const attrNames = requestedAttributes[attribute]?.names
    const revealedValues = revealedAttributeGroups[attribute]?.values

    if (attrNames && revealedValues) {
      for (const attributeName of attrNames) {
        result[attributeName] = revealedValues[attributeName].raw
      }
    }
  }

  return result
}

export const extractRequestedPredicates = (data: FormattedProof): Record<string, string> => {
  type PredicateInfo = {
    name: string
    p_value: number
    p_type: string
  }

  const requestedPredicatesJson = JsonTransformer.toJSON(data.request?.anoncreds ?? {}).requested_predicates as Map<
    string,
    AnonCredsRequestedPredicate
  >

  const result: Record<string, string> = {}

  Object.values(requestedPredicatesJson ?? {}).map((predicateInfo: PredicateInfo) => {
    // Add the p_value because we otherwise lose this info about comparison
    result[predicateInfo.name] = `${predicateInfo.p_type} ${predicateInfo.p_value}`
  })
  return result
}

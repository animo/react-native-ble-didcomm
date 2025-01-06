enum Constants {
  /*  The number of bytes we adjust for in the chunking algorithm to account for the data header
    (3 bytes) + 9 extra bytes to be sure = 12 bytes */
  static let numberOfBytesForHeader: Int = 12
}
